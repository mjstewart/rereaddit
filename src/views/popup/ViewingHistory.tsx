import * as React from 'react';
import { Grid, Header, Button, Table } from 'semantic-ui-react';
import { CommentEntry, Comment } from '@js/content-scripts/comments';
import * as moment from 'moment';

const ViewingHistory = (comments: CommentEntry) => (
  <div>
    <Header as="h3" dividing>
      Viewing History
    </Header>

    <Table celled>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell>URL</Table.HeaderCell>
          <Table.HeaderCell>Title</Table.HeaderCell>
          <Table.HeaderCell>Orginal submitter</Table.HeaderCell>
          <Table.HeaderCell>Last viewed</Table.HeaderCell>
          <Table.HeaderCell>Unread comments</Table.HeaderCell>
          <Table.HeaderCell>Unfollow</Table.HeaderCell>
        </Table.Row>

        <Table.Body>
          {Object.keys(comments).map(key => Row(comments[key]))}
        </Table.Body>
      </Table.Header>
    </Table>
  </div>
);

const Row = (comment: Comment) => (
  <Table.Row>
    <Table.Cell>
      <a href={`https://www.reddit.com/r/test/comments/${comment.articleId}`}>Link</a>
    </Table.Cell>
    <Table.Cell>{comment.title}</Table.Cell>
    <Table.Cell>{comment.tagline}</Table.Cell>
    <Table.Cell>{moment(comment.lastViewedTime).fromNow()}</Table.Cell>
    <Table.Cell>0</Table.Cell>
    <Table.Cell>
      <Button basic color="red" size="mini">
        Unfollow
      </Button>
    </Table.Cell>
  </Table.Row>
);


export default ViewingHistory;
