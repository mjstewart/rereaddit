require('./popup.scss');
import * as React from 'react';
import { Grid, Header, Container } from 'semantic-ui-react';
import StorageSettings from './StorageSettings';

const Popup = () => (
  <div className="wrapper">
    <header>
      <Header as="h1">
        rereaddit
          <Header.Subheader>
          Manage unread reddit comments
          </Header.Subheader>
      </Header>
    </header>

    <Container>
      <StorageSettings />
    </Container>
    
  </div>
);

export default Popup;
