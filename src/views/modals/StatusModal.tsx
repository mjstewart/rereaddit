import * as React from 'react';
import { Modal, Button, Header, Icon } from 'semantic-ui-react';

interface State {
  open: boolean;
}

type ModalType = 'success' | 'error';

interface Props {
  message: string;
  type: ModalType;

  /**
   * Notify that modal is closing in case parent needs to perform
   * any closing down operations.
   */
  onClose: () => void;
}

type Setting = {
  color: 'red' | 'green',
  title: string,
};

class ErrorModal extends React.Component<Props, State> {

  private settings: Map<ModalType, Setting> = new Map<ModalType, Setting>([
    ['success', { color: 'green', title: 'Success' }],
    ['error', { color: 'red', title: 'Error' }],
  ]);

  constructor(props) {
    super(props);
    const x = this.settings.get('success')!;

    this.state = {
      open: true,
    };
  }

  onClose = () => {
    this.setState({
      open: false,
    });
    this.props.onClose();
  }

  render() {
    return (
      <Modal size="mini" open={this.state.open} onClose={this.onClose}>
        <Modal.Header>
          <Header as="h2" color={this.settings.get(this.props.type)!.color}>
            <Header.Content>
              {this.settings.get(this.props.type)!.title}
            </Header.Content>
          </Header>
        </Modal.Header>
        <Modal.Content>
          <p>{this.props.message}</p>
        </Modal.Content>
        <Modal.Actions>
          <Button onClick={this.onClose}>
            Got it!
          </Button>
        </Modal.Actions>
      </Modal>
    );
  }
}

export default ErrorModal;
