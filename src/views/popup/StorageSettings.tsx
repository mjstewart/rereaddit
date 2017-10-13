import * as React from 'react';
import { Message, sendMessage } from '@js/messages';
import { Grid, Header, Button, Modal } from 'semantic-ui-react';
import * as logging from '@js/logging';
import StatusModal from '@views/modals/StatusModal';
import * as has from 'lodash.has';
import {
  repository,
  StorageType,
  getError,
  getArticleIdFromCommentUrl,
} from '@js/storage';

interface State {
  data: { [key: string]: any };
  url: string;
  shortUrl: string;
  articleId: string;
  error?: string;
  success?: string;
}

class StorageSettings extends React.Component<{}, State> {
  constructor(props) {
    super(props);

    this.state = {
      data: {},
      url: '',
      shortUrl: '',
      articleId: '',
    };
  }

  componentDidMount() {
    this.loadCommentHistory();
    this.loadUrl();
  }

  loadUrl = async () => {
    try {
      const url = await sendMessage<string>(Message.GET_CURRENT_TAB_URL);
      this.setState({
        url,
        shortUrl: this.shortenUrl(url),
        articleId: getArticleIdFromCommentUrl(url),
      });
    } catch (e) {
      this.setState({ url: '' });
    }
  }

  loadCommentHistory = async () => {
    try {
      const data = await repository.getAllBy((key, type) => type !== StorageType.SETTING);
      this.setState({ data });
    } catch (e) {
      this.setState({ error: `Unable to get all data from storage ${e}` });
    }
  }

  getTotalStorageEntries = () => {
    return Object.keys(this.state.data).length;
  }

  viewStorage = async () => {
    logging.logWithPayload('all non setting storage', this.state.data);
    logging.logWithPayload('this.state', this.state);
  }

  deleteAllStorage = async () => {
    try {
      const deleted = await repository.deleteAll();
      if (deleted) {
        this.setState({ data: {}, success: 'All history succesfully deleted' });
      } else {
        this.setState({ error: 'Not all history could be deleted' });
      }
    } catch (e) {
      this.setState({ error: `Uanble to delete all history: ${e}` });
    } finally {
      this.loadCommentHistory();
    }
  }

  deleteHistoryForThisArticleOnly = async () => {
    try {
      const articleId = getArticleIdFromCommentUrl(this.state.url);
      const deleted = await repository.deleteKeys([articleId]);
      if (deleted) {
        this.setState({ data: {}, success: 'History for this thread succesfully deleted' });
      } else {
        this.setState({ error: 'Unable to delete the history for this thread' });
      }
    } catch (e) {
      this.setState({ error: `Unable to delete the history for this thread: ${e}` });
    } finally {
      this.loadCommentHistory();
    }
  };

  onModalClose = () => {
    this.setState({ error: undefined, success: undefined });
  }

  isInArticle = () => {
    return this.state.url.indexOf('comments') >= 0;
  }

  shortenUrl = (url: string) => {
    const MAX_LENGTH = 50;

    const tokens = url.split('/');
    const index = tokens.indexOf('r');
    const shortUrl = tokens.slice(index).join('/');
    if (shortUrl.length >= MAX_LENGTH) {
      return shortUrl.slice(0, MAX_LENGTH) + '...';
    }
    return shortUrl;
  }

  /**
   * Returns true iff the url's article id is already in storage meaning
   * the user has already visited this article and has the option to unfollow.
   */
  showUnfollowThisArticle = () => {
    return this.isInArticle && has(this.state.data, this.state.articleId);
  }

  render() {
    return (
      <div>
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

        <Header as="h3" dividing>
          Storage
        </Header>
        <Grid>
          <Grid.Row >
            <Grid.Column width={10} >
              <p>Clear all history</p>
            </Grid.Column>
            <Grid.Column width={6} >
              <Button basic color="red" size="mini" onClick={this.deleteAllStorage}>
                Delete
              </Button>
              <Button basic color="blue" size="mini" onClick={this.viewStorage}>
                View ({this.getTotalStorageEntries()})
              </Button>
            </Grid.Column>
          </Grid.Row>
          {this.showUnfollowThisArticle() ?
            <Grid.Row >
              <Grid.Column width={10} >
                <div id="unfollow-thread">
                  <p>Unfollow this article only</p>
                  <p className="small-subheader">{this.state.shortUrl}</p>
                </div>
              </Grid.Column>
              <Grid.Column width={6} >
                <Button basic color="red" size="mini" onClick={this.deleteHistoryForThisArticleOnly}>
                  Delete
            </Button>
              </Grid.Column>
            </Grid.Row>
            : null}

        </Grid>
      </div>
    );
  }
}

export default StorageSettings;
