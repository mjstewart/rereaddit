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
      this.getUnreadTotals(comments);

      this.setState({ comments });
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

  getUnreadTotals = (comments: Comment[]) => {
    logging.logWithPayload('Popup, getUnreadTotals for', comments);
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
