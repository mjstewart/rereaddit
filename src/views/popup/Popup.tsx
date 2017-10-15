require('./popup.scss');
import * as React from 'react';
import { Grid, Header, Container } from 'semantic-ui-react';
import StorageSettings from './StorageSettings';
import { APP_SLOGAN } from '@js/settings';
import { MessageType, sendMessage } from '@js/messages';
import * as logging from '@js/logging';
import StatusModal from '@views/modals/StatusModal';
import { CommentEntry, Comment } from '@js/content-scripts/comments';
import ViewingHistory from './ViewingHistory';
import * as reduce from 'lodash.reduce';
import * as sortby from 'lodash.sortby';
import * as pick from 'lodash.pick';
import * as isempty from 'lodash.isempty';
import * as moment from 'moment';
import {
  repository,
  StorageType,
  getError,
  getArticleIdFromCommentUrl,
} from '@js/storage';

interface State {
  // Easier for children to deal with comments in an array rather than object for sorting reasons. 
  comments: Comment[];

  url: string;
  articleId: string;
  error?: string;
  success?: string;
}

class Popup extends React.Component<{}, State> {
  constructor(props) {
    super(props);

    this.state = {
      comments: [],
      url: '',
      articleId: '',
    };
  }

  componentDidMount() {
    this.loadComments();
    this.loadUrl();
  }

  setSortedComments = (comments: Comment[]) => {
    logging.log('setSortedComments');
    this.setState({ comments });
  }

  loadComments = async () => {
    try {
      const entries: CommentEntry = await repository.getAllBy((key, type) => type === StorageType.COMMENT);

      const comments: Comment[] = reduce(
        entries,
        (acc: Comment[], value, key) => {
          acc.push(value);
          return acc;
        },
        []);
        

      logging.logWithPayload('Popup LOAD COMMENTS should be array: ', comments);
      
      // Show loading spinner in Popup render?. setstate loading to begin in constructor
      // then set loading false when all promises are resolved!.
      //  css for view count make green.
      // order viewing history by most unread then by last viewed.
      const commentsWithUpdatedUnreadCounts  = await Promise.all(this.getUnreadTotals(comments));
      this.setState({ comments: commentsWithUpdatedUnreadCounts });
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

  parseUnreadCount = async (comment: Comment, articleUrl: string): Promise<Comment> => {
    try {
      const payload = await fetch(articleUrl);
      const json = await payload.json();
      logging.logWithPayload('parse json: ', json);

      // json response should always be an array with 2 elements
      // index 0 is the original post, index 1 is the entry point to the main comments
      if (!(Array.isArray(json) && json.length === 2)) {
        return {
          ...comment,
          unread: 0, 
        };
      }

      // Give stack initial value to begin recursive walk.
      const stack = [json[1].data];
      logging.logWithPayload('parse initial stack is: ', stack);

      const unreadComments: any = [];
    
      while (stack.length > 0) {
        const data = stack.pop();
        const meta = pick(data, 'body', 'created_utc', 'author');
        if (!isempty(meta)) {
          const created = moment.unix(meta.created_utc);
          if (created.isAfter(moment(new Date(comment.lastViewedTime)))) {
            unreadComments.push(meta);
          }
        }
        
        if (data.children) {
          data.children.forEach(child => stack.push(child.data));
        }

        if (data.replies) {
          stack.push(data.replies.data);
        }
      }
      
      const newComment: Comment = {
        ...comment,
        unread: unreadComments.length,
      };

      // need to add unread to Comment type. set it 0 to start with.
      logging.logWithPayload('collected results after parsing', unreadComments);
      logging.logWithPayload('newComment', newComment);

      // const body = await payload.text();
      return newComment;
    } catch (e) {
      return e;
    }
  }

  /**
   * const created = moment.unix(1507930628.0);

console.log(created.utc().format('ddd DD MMM HH:mm:ss YYYY zz'));
console.log(created.utc());
   */
  getUnreadTotals = (comments: Comment[]): Promise<Comment>[] => {
    logging.logWithPayload('Popup, getUnreadTotals for', comments);
    return comments.map(async (comment) => {
      const articleUrl = `https://www.reddit.com/r/${comment.subreddit}/comments/${comment.articleId}.json`;
      return await this.parseUnreadCount(comment, articleUrl);
    });
  }

  deleteAllNonSettings = async () => {
    try {
      logging.log('Popup deleteAllStorage');
      const deleted = await repository.deleteBy((key, type) => type !== StorageType.SETTING);
      if (deleted) {
        this.setState({ success: 'All history succesfully deleted' });
      } else {
        this.setState({ error: 'Not all history could be deleted' });
      }
    } catch (e) {
      this.setState({ error: `Unable to delete all history: ${e}` });
    } finally {
      this.loadComments();
    }
  }

  deleteArticle = async (articleId: string) => {
    logging.logWithPayload('Popup deleteArticle', articleId);
    try {
      const deleted = await repository.deleteKeys([articleId]);
      if (deleted) {
        this.setState({ success: 'History for this article succesfully deleted' });
      } else {
        this.setState({ error: 'Unable to delete the history for this article' });
      }
    } catch (e) {
      this.setState({ error: `Unable to delete the history for this article: ${e}` });
    } finally {
      this.loadComments();
    }
  };

  onModalClose = () => {
    this.setState({ error: undefined, success: undefined });
  }

  render() {
    return (
      <div className="wrapper">
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
            setSortedComments={this.setSortedComments}
            deleteArticle={this.deleteArticle}
          />
        </Container>
      </div>
    );
  }
}


export default Popup;
