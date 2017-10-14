import * as React from 'react';
import { Message, sendMessage } from '@js/messages';
import { Grid, Header, Button, Modal } from 'semantic-ui-react';
import * as logging from '@js/logging';
import StatusModal from '@views/modals/StatusModal';
import * as findIndex from 'lodash.findindex';
import { CommentEntry, Comment } from '@js/content-scripts/comments';
import {
  repository,
  StorageType,
  getError,
  getArticleIdFromCommentUrl,
} from '@js/storage';

interface Props {
  comments: Comment[];
  url: string;
  articleId: string;
  deleteAllNonSettings: () => Promise<void>;
  deleteArticle: (articleId: string) => Promise<void>;
}

class StorageSettings extends React.Component<Props, {}> {
  constructor(props) {
    super(props);
  }

  viewStorage = async () => {
    logging.logWithPayload('StorageSettings this.props', this.props);
    const all = await repository.getAll();
    logging.logWithPayload('All storage', all);
  }

  isInArticle = () => {
    return this.props.url.indexOf('comments') >= 0;
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
   * Returns true iff the url's article id provided by props is already in the list of comments.
   * This means the user has already visited this article and has the option to unfollow.
   */
  showUnfollowThisArticle = () => {
    return this.isInArticle() &&
      findIndex(
        this.props.comments,
        (comment: Comment) => comment.articleId === this.props.articleId,
      ) !== -1;
  }

  deleteArticle = () => this.props.deleteArticle(this.props.articleId);

  render() {
    return (
      <div>
        <Header as="h3" dividing>
          Storage
        </Header>
        <Grid>
          <Grid.Row >
            <Grid.Column width={10} >
              <p>Clear all history</p>
            </Grid.Column>
            <Grid.Column width={6} >
              <Button basic color="red" size="mini" onClick={this.props.deleteAllNonSettings}>
                Delete
              </Button>
              <Button basic color="blue" size="mini" onClick={this.viewStorage}>
                View ({this.props.comments.length})
              </Button>
            </Grid.Column>
          </Grid.Row>
          {this.showUnfollowThisArticle() ?
            <Grid.Row >
              <Grid.Column width={10} >
                <div id="unfollow-thread">
                  <p>Unfollow this article only</p>
                  <p className="small-subheader">{this.shortenUrl(this.props.url)}</p>
                </div>
              </Grid.Column>
              <Grid.Column width={6} >
                <Button basic color="red" size="mini" onClick={this.deleteArticle}>
                  Unfollow
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
