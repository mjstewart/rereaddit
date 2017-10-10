import * as React from 'react';
import { Grid, Header, Button } from 'semantic-ui-react';

class StorageSettings extends React.Component<any, never> {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <Header as="h3" dividing>
          Storage
        </Header>
        <Grid>
          <Grid.Row >
            <Grid.Column width={8} >
              <p>Clear all storage</p>
            </Grid.Column>
            <Grid.Column width={8} >
              <Button basic color="red" size="mini">Delete</Button>
              <Button basic color="blue" size="mini">View (6)</Button>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row >
            <Grid.Column width={8} >
              <p>Clear storage for this thread only</p>
            </Grid.Column>
            <Grid.Column width={8} >
            <Button basic color="red" size="mini">Delete</Button>
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </div>
    );
  }
}

export default StorageSettings;
