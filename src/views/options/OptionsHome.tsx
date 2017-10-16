const githubLogo = require('@src/img/GitHub-Mark-32px.png');

import * as React from 'react';
import { Grid, Header, Container, Icon, Form, Button, Dropdown } from 'semantic-ui-react';
import { repository, StorageType } from '@js/storage';
import * as logging from '@js/logging';
import StatusModal from '@views/modals/StatusModal';
import * as moment from 'moment';
import * as find from 'lodash.find';

import {
  APP_SLOGAN,
  GITHUB_URL,
  settingKeys,
  UnreadCommentColorSetting,
  makeUnreadColorSetting,
  makeDefaultUnreadColorSetting,
  DEFAULT_UNREAD_COMMENT_COLOR,
  DEFAULT_DELETE_FREQUENCY,
  DeleteFrequency,
  DeleteFrequencySetting,
  makeDeleteFrequencySetting,
  makeDefaultDeleteFrequencySetting,
} from '@js/settings';

interface State {
  unreadCommentColor: string;
  selectedDeleteFrequency?: DeleteFrequencyOption;
  success?: string;
  error?: string;
}

interface DeleteFrequencyOption {
  text: string;
  value: DeleteFrequency;
}

class OptionsHome extends React.Component<{}, State> {

  private deleteFrequencyOptions: DeleteFrequencyOption[] = [
    {
      text: '1 day',
      value: DeleteFrequency.DAY_1,
    },
    {
      text: '2 days',
      value: DeleteFrequency.DAY_2,
    },
    {
      text: '3 days',
      value: DeleteFrequency.DAY_3,
    },
    {
      text: '4 days',
      value: DeleteFrequency.DAY_4,
    },
    {
      text: '5 days',
      value: DeleteFrequency.DAY_5,
    },
    {
      text: '1 week',
      value: DeleteFrequency.WEEK_1,
    },
    {
      text: '2 weeks',
      value: DeleteFrequency.WEEK_2,
    },
  ];

  constructor(props) {
    super(props);

    this.state = {
      unreadCommentColor: DEFAULT_UNREAD_COMMENT_COLOR,
    };
  }

  componentDidMount() {
    type QueryResult = UnreadCommentColorSetting & DeleteFrequencySetting;
    // Initialise any settings that are already in storage.
    repository.get<QueryResult>([settingKeys.unreadCommentColor, settingKeys.deleteFrequency])
      .then((result: QueryResult) => {
        this.setState({
          unreadCommentColor: result.unreadCommentColor.color,
          selectedDeleteFrequency: this.getDeleteFrequencyOption(result.deleteFrequency.frequency),
        });
      })
      .catch((error) => {
        this.setState({ error });
      });
  }

  wipe = async () => {
    await repository.deleteAll();
  }

  getDeleteFrequencyOption = (frequency: DeleteFrequency): DeleteFrequencyOption => {
    return find(this.deleteFrequencyOptions, (option: DeleteFrequencyOption) => {
      return option.value === frequency;
    });
  }

  deleteAllNonSettings = async () => {
    try {
      const deleted = await repository.deleteBy((key, type) => type !== StorageType.SETTING);
      if (deleted) {
        this.setState({ success: 'All history succesfully deleted' });
      } else {
        this.setState({ error: 'Not all history could be deleted' });
      }
    } catch (e) {
      this.setState({ error: `Unable to delete all history: ${e}` });
    }
  }

  /**
   * Handler for changing the unread comment color picker value by updating state.
   */
  onUnreadCommentColorChange = async (event) => {
    const color = event.target.value;

    try {
      await repository.save(makeUnreadColorSetting(color));
      this.setState({ unreadCommentColor: color });
    } catch (e) {
      this.setState({ error: 'Error saving unread color to storage' });
    }
  };

  /**
   * Override existing keys with defaults.
   */
  onRestoreDefaults = async () => {
    try {
      await repository.save(makeDefaultUnreadColorSetting());
      await repository.save(makeDefaultDeleteFrequencySetting());

      this.setState({
        unreadCommentColor: DEFAULT_UNREAD_COMMENT_COLOR,
        selectedDeleteFrequency: this.getDeleteFrequencyOption(DEFAULT_DELETE_FREQUENCY),
      });
    } catch (e) {
      this.setState({ error: 'Error restoring defaults' });
    }
  };

  onModalClose = () => {
    this.setState({ error: undefined, success: undefined });
  }

  onDeleteFrequencyChange = (async (e, data) => {
    const frequency: DeleteFrequency = data.value;

    try {
      await repository.save(makeDeleteFrequencySetting(frequency));
      this.setState({ selectedDeleteFrequency: this.getDeleteFrequencyOption(frequency) });
    } catch (e) {
      this.setState({ error: 'Error saving delete frequency to storage' });
    }
  });

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
          <Header as="h1" textAlign="center" icon>
            <Icon name="settings" />
            rereaddit extension settings
            <Header.Subheader className="italic">
              {APP_SLOGAN}
            </Header.Subheader>
            <a href={GITHUB_URL}>
              <img src={githubLogo} alt="GitHub Logo" />
            </a>
          </Header>
        </header>

        <Container>
          <Container textAlign="center">
            <Button basic color="red" size="tiny" onClick={this.onRestoreDefaults}>Restore Defaults</Button>
            <Button basic color="red" size="tiny" onClick={this.deleteAllNonSettings}>Delete History</Button>
          </Container>
          <Header as="h3" dividing>
            General
        </Header>
          <div className="setting">
            <label>Unread comment color</label>
            <input type="color"
              onChange={this.onUnreadCommentColorChange}
              value={this.state.unreadCommentColor} />
          </div>
          <div className="setting">
            <span>
              Delete articles I have not revisited after {' '}
              <Dropdown placeholder="Frequency" inline
                options={this.deleteFrequencyOptions}
                value={this.state.selectedDeleteFrequency ? this.state.selectedDeleteFrequency.value : undefined}
                onChange={this.onDeleteFrequencyChange} />
            </span>
          </div>
        </Container>
      </div>
    );
  }
}


export default OptionsHome;
