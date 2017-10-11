import * as React from 'react';
import { Modal, Button, Header, Icon } from 'semantic-ui-react';

interface State {
  open: boolean;
}

interface Props {
  errorMessage: string;

  /**
   * Notify that modal is closing incase parent needs to perform
   * and closing down operations.
   */
  onClose: () => void;
}

class ErrorModal extends React.Component<Props, State> {

  constructor(props) {   
    super(props);

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
          <Header as="h2" color="red">
            <Header.Content>
              Error
            </Header.Content>
          </Header>
        </Modal.Header>
        <Modal.Content>
          <p>{this.props.errorMessage}</p>
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
