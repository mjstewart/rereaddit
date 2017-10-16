require('./popup.scss');
import * as React from 'react';
import { Grid, Header, Container, Dimmer, Loader } from 'semantic-ui-react';
import StorageSettings from './StorageSettings';
import { APP_SLOGAN } from '@js/settings';
import { MessageType, sendMessage } from '@js/messages';
import * as logging from '@js/logging';
import StatusModal from '@views/modals/StatusModal';
import { CommentEntry, Comment } from '@js/content-scripts/comments';
import ViewingHistory from './ViewingHistory';
import * as reduce from 'lodash.reduce';
import * as orderBy from 'lodash.orderby';
import * as pick from 'lodash.pick';
import * as isempty from 'lodash.isempty';
import * as moment from 'moment';
import {
  repository,
  StorageType,
  getError,
  getArticleIdFromCommentUrl,
} from '@js/storage';

// Values correspond to the property in each Comment to sort by.
export enum SortableField {
  Title = 'title',
  Sub = 'subreddit',
  LastViewed = 'lastViewedTime',
  UnreadCount = 'unread',
}

export enum SortDirection {
  Ascending = 'ascending',
  Descending = 'descending',
}

interface State {
  // Easier for children to deal with comments in an array rather than object for sorting reasons. 
  comments: Comment[];
  url: string;
  articleId: string;
  isLoading: boolean;
  error?: string;
  success?: string;
  sortField: SortableField;
  sortDirection: SortDirection;
}

type Meta = {
  body: string,
  created_utc: number,
  author: string,
};

class Popup extends React.Component<{}, State> {
  constructor(props) {
    super(props);

    this.state = {
      comments: [],
      url: '',
      articleId: '',
      isLoading: false,
      sortField: SortableField.UnreadCount,
      sortDirection: SortDirection.Descending,
    };
  }

  componentDidMount() {
    this.loadComments();
    this.loadUrl();
  }

  sortComments = (field: SortableField, direction: SortDirection) => {
    // convert into lodash ordering constants
    const lodashSortDirection = direction === SortDirection.Ascending ? 'asc' : 'desc';

    let sortedComments = this.state.comments;

    switch (field) {
      case SortableField.Title:
        sortedComments = orderBy(this.state.comments, (c: Comment) => c.title.toLowerCase(), [lodashSortDirection]);
        break;
      case SortableField.Sub:
        sortedComments = orderBy(this.state.comments, (c: Comment) => c.subreddit.toLowerCase(), [lodashSortDirection]);
        break;
      default:
        sortedComments = orderBy(this.state.comments, [field], [lodashSortDirection]);
    }
    
    this.setState({
      comments: sortedComments,
      sortField: field,
      sortDirection: direction,
    });
  }

  loadComments = async () => {
    try {
      this.setState({ isLoading: true });

      const entries: CommentEntry = await repository.getAllBy((key, type) => type === StorageType.COMMENT);

      const comments: Comment[] = reduce(
        entries,
        (acc: Comment[], value, key) => {
          acc.push(value);
          return acc;
        },
        []);

      const commentsWithUnreadCounts = await Promise.all(this.getUnreadTotals(comments));
      const sortedComments = orderBy(
        commentsWithUnreadCounts,
        [SortableField.UnreadCount, SortableField.LastViewed], ['desc', 'desc'],
      );

      this.setState({ comments: sortedComments, isLoading: false });
    } catch (e) {
      this.setState({ error: `Unable to get all comments from storage ${e}` });
    }
  }

  loadUrl = async () => {
    try {
      const url = await sendMessage<string>({ type: MessageType.GET_CURRENT_TAB_URL });
      this.setState({
        url,
        articleId: getArticleIdFromCommentUrl(url),
      });
    } catch (e) {
      this.setState({ url: '', articleId: '' });
    }
  }

  /**
   * Go through the thread and collect all unread comments.
   * Only the comments returned in the json payload are scanned which means not all
   * unread comments will be found if there are 500+ comments.
   */
  parseUnreadCount = async (comment: Comment, articleUrl: string): Promise<Meta[]> => {
    try {
      const payload = await fetch(articleUrl);
      const json = await payload.json();

      // json response should always be an array with 2 elements
      // index 0 is the original post, index 1 is the entry point to the main comments
      if (!(Array.isArray(json) && json.length === 2)) {
        return [];
      }

      type Entry = {
        kind: string;
        data: { [key: string]: any };
      };
      
      // Give stack initial value to begin recursive walk.
      const stack: Entry[] = [json[1]];
      const unreadComments: Meta[] = [];

      while (stack.length > 0) {
        const entry: Entry = stack.pop()!;
        const meta: Meta = pick(entry.data, 'body', 'created_utc', 'author');

        if (!isempty(meta)) {
          const created = moment.unix(meta.created_utc);
          if (created.isAfter(moment(new Date(comment.lastViewedTime)))) {
            unreadComments.push(meta);
          }
        }

        if (!isempty(entry.data.children)) {
          entry.data.children.forEach((child: Entry) => {
            // this is where we would recursively follow more comments to load.
            if (child.kind !== 'more') {
              stack.push(child);
            }
          });
        }

        if (!isempty(entry.data.replies)) {
          stack.push(entry.data.replies);
        }
      }
      return unreadComments;
    } catch (e) {
      return e;
    }
  }

  /**
   * For every article/thread (I call it Comment), fetch the json payload and find all unread comments by extracting
   * some basic meta deta.
   * 
   * There is no guarentee every unread comment will be found as there is no simple way to get every comment for 
   * a thread since reddit doesn't load all comments. At max 500 comments are loaded and there could be 'load more comment'
   * links in the html document. It's actually quite difficult to fetch all the comments and the reddit api is hard to use,
   * especially from a browser. 
   * 
   * A simpler solution for the time being is to just sort by new comments on the assumption that most of the unread comments
   * will be in the returned json. This is still fragile as its likely to miss deeply nested new comments that are likely
   * to have 'load more comments' in the html.
   * 
   * What I am trying to do doesn't really work well with reddits commenting structure. 
   * Since the aim of this plugin is to highlight all unread comments, it makes sense for ALL comments to be loaded into the DOM
   * but reddit doesn't do it like this. Any comments that are lazy loaded have 'load more comments'. 
   * 
   * The only way around this would be to build an app that renders a new html page that shows all unread comments after 
   * somehow extracting ALL of the comments. But then the issue with this is that you lose the context of what the 
   * comment was in reply to given the comment heirachy is lost.
   * 
   * Potential exists for more comments to be highlighted than the parseUnreadCount picks up. This is because the DOM 
   * may contain more comments than those appearing in the json payload hence the unread counts are just a rough estimate.
   */
  getUnreadTotals = (comments: Comment[]): Promise<Comment>[] => {
    return comments.map(async (comment) => {
      const articleUrl = `https://www.reddit.com/r/${comment.subreddit}/comments/${comment.articleId}.json?sort=new&limit=500`;
      const unreadComments = await this.parseUnreadCount(comment, articleUrl);
      return {
        ...comment,
        unread: unreadComments.length,
      };
    });
  }

  deleteAllNonSettings = async () => {
    try {
      const deleted = await repository.deleteBy((key, type) => type !== StorageType.SETTING);
      if (!deleted) {
        this.setState({ error: 'Not all history could be deleted' });
      }
    } catch (e) {
      this.setState({ error: `Unable to delete all history: ${e}` });
    } finally {
      this.loadComments();
    }
  }

  deleteArticle = async (articleId: string) => {
    try {
      const deleted = await repository.deleteKeys([articleId]);
      if (deleted) {
        this.setState({
          comments: this.state.comments.filter(comment => comment.articleId !== articleId),
        });
      } else {
        this.setState({ error: 'Unable to delete the history for this article' });
      }
    } catch (e) {
      this.setState({ error: `Unable to delete the history for this article: ${e}` });
    }
  };

  onModalClose = () => {
    this.setState({ error: undefined, success: undefined });
  }

  render() {
    return (
      <div className="wrapper">
        <Dimmer active={this.state.isLoading}>
          <Loader>Loading</Loader>
        </Dimmer>

        {this.state.error ?
          <StatusModal
            type={'error'}
            message={this.state.error}
            onClose={this.onModalClose} />
          : null}

        {this.state.success ?
          <StatusModal
            type={'success'}
            message={this.state.success}
            onClose={this.onModalClose} />
          : null}

        <header>
          <Header as="h1">
            rereaddit
          <Header.Subheader className="italic">
              {APP_SLOGAN}
            </Header.Subheader>
          </Header>
        </header>

        <Container>
          <StorageSettings
            comments={this.state.comments}
            url={this.state.url}
            articleId={this.state.articleId}
            deleteAllNonSettings={this.deleteAllNonSettings}
            deleteArticle={this.deleteArticle}
          />

          <ViewingHistory
            comments={this.state.comments}
            sortField={this.state.sortField}
            sortDirection={this.state.sortDirection}
            sortComments={this.sortComments}
            deleteArticle={this.deleteArticle}
          />
        </Container>
      </div>
    );
  }
}

export default Popup;
