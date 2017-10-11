require('./options.scss');
const githubLogo = require('@src/img/GitHub-Mark-32px.png');

import * as React from 'react';
import { Grid, Header, Container, Icon, Form, Button } from 'semantic-ui-react';
import { repository } from '@js/storage';
import * as logging from '@js/logging';
import ErrorModal from '@views/ErrorModal';
import {
  settingKeys,
  StorageType,
  UnreadCommentColor,
  makeUnreadColorSetting,
  DEFAULT_UNREAD_COMMENT_COLOUR,
} from '@js/settings';

interface State {
  unreadCommentColor: string;
  error?: string;
}

class OptionsHome extends React.Component<{}, State> {
  constructor(props) {
    super(props);

    this.state = {
      unreadCommentColor: DEFAULT_UNREAD_COMMENT_COLOUR,
    };
  }

  componentDidMount() {
    // Initialise any settings that are already in storage.
    repository.get<UnreadCommentColor>(settingKeys.unreadCommentColor)
      .then((result) => {
        this.setState({
          unreadCommentColor: result.unreadCommentColor.color,
        });
      })
      .catch((error) => {
        this.setState({ error });
      });
  }

  /**
   * Handler for changing the unread comment color picker value by updating state.
   */
  onUnreadCommentColorChange = (event) => {
    const color = event.target.value;
    logging.logWithPayload('onUnreadCommentColorChange: saving new value', makeUnreadColorSetting(color));

    repository.save(makeUnreadColorSetting(color))
      .then(saved => this.setState({ unreadCommentColor: color }))
      .catch(() => this.setState({ error: 'Error saving to storage' }));
  };

  /**
   * Override existing keys with defaults.
   */
  onRestoreDefaults = () => {
    repository.save(makeUnreadColorSetting(DEFAULT_UNREAD_COMMENT_COLOUR))
      .then(() => {
        this.setState({
          unreadCommentColor: DEFAULT_UNREAD_COMMENT_COLOUR,
        });
        logging.logWithPayload('onRestoreDefaults state', this.state);
      })
      .catch(() => this.setState({ error: 'Error saving to storage' }));
  };

  onErrorModalClose = () => {
    this.setState({ error: undefined });
    logging.logWithPayload('onErrorModalClose state', this.state);
  }

  getContent = () => (
    <div>
      <header>
        <Header as="h1" textAlign="center">
          rereaddit extension settings
        <Header.Subheader className="italic">
            Track and manage unread reddit comments
        </Header.Subheader>

          <a href="https://github.com/mjstewart/rereaddit">
            <img src={githubLogo} alt="GitHub Logo" />
          </a>
        </Header>
      </header>

      <Container>
        <Container textAlign="center">
          <Button negative size="tiny" onClick={this.onRestoreDefaults}>Restore Defaults</Button>
        </Container>
        <Header as="h3" dividing>
          General
        </Header>
        <Form.Field>
          <label>Unread comment color</label>
          <input type="color"
            onChange={this.onUnreadCommentColorChange}
            value={this.state.unreadCommentColor} />
        </Form.Field>
      </Container>
    </div>
  )

  render() {
    return (
      <div className="wrapper">
        {this.state.error ?
          <ErrorModal
            errorMessage={this.state.error}
            onClose={this.onErrorModalClose} />
          : this.getContent()}
      </div>
    );
  }
}


export default OptionsHome;
