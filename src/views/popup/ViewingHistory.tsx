import * as React from 'react';
import * as logging from '@js/logging';
import { Grid, Header, Button, Table } from 'semantic-ui-react';
import { Comment } from '@js/content-scripts/comments';
import * as moment from 'moment';
import { sendMessage, MessageType } from '@js/messages';

interface Props {
  comments: Comment[]; 
  setSortedComments: (comments: Comment[]) => void;
}

enum Column {
  Title = 'Title',
  Sub = 'Sub',
  LastViewed = 'LastViewed',
  UnreadCount = 'UnreadCount',
}

enum Direction {
  Ascending = 'ascending',
  Descending = 'descending',
}

interface State {
  column: Column;
  direction: Direction;
}

class ViewingHistory extends React.Component<Props, State> {
  constructor(props) {
    super(props);

    this.state = {
      column: Column.UnreadCount,
      direction: Direction.Descending,
    };
  }

  handleSort = (clickedColumn: Column) => () => {
    const { column, direction } = this.state;
    const { setSortedComments } = this.props;
     
    if (clickedColumn !== column) {
      this.setState({
        column,
        direction: Direction.Ascending,
      });
      
    }
    

    switch (column) {
      case Column.Title:

        break;
      case Column.Sub:
        break;
      case Column.LastViewed:
        break;
      case Column.UnreadCount:
        break;
    }
  }

  render() {
    const { column, direction } = this.state;
    const { comments } = this.props;
    return (
      <div id="viewing-history">
        <Header as="h3" dividing>
          Viewing History ({comments.length})
      </Header>

        {comments.length === 0 ? null :
          <Table celled sortable size={'small'}>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell
                  width={7}
                  sorted={column === Column.Title ? direction : undefined}
                  onClick={this.handleSort(Column.Title)}>
                  Title
                </Table.HeaderCell>
                <Table.HeaderCell
                  width={1}
                  sorted={column === Column.Sub ? direction : undefined}>
                  Sub
                </Table.HeaderCell>
                <Table.HeaderCell
                  width={4}
                  sorted={column === Column.LastViewed ? direction : undefined}>
                  Last viewed
                </Table.HeaderCell>
                <Table.HeaderCell
                  width={2}
                  sorted={column === Column.UnreadCount ? direction : undefined}>
                  # Unread
                </Table.HeaderCell>
                <Table.HeaderCell width={2}>Unfollow</Table.HeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {comments.map(entry => Row(entry))}
            </Table.Body>
          </Table>}
      </div>
    );
  }
}

const shortenTitle = (title: string) => {
  const MAX_LENGTH = 60;

  if (title.length >= MAX_LENGTH) {
    return title.slice(0, MAX_LENGTH) + '...';
  }
  return title;
};

const openTab = (url: string) => () => {
  logging.logWithPayload('openTab', url);
  sendMessage({ url, type: MessageType.OPEN_TAB });
};

const Row = (comment: Comment) => {
  const articleUrl = `https://www.reddit.com/r/${comment.subreddit}/comments/${comment.articleId}`;
  const subredditRedirectUrl = `https://www.reddit.com/r/${comment.subreddit}`;

  return (
    <Table.Row key={comment.articleId}>
      <Table.Cell width={7}>
        <a onClick={openTab(articleUrl)} href={articleUrl}>
          {shortenTitle(comment.title)}
        </a>
      </Table.Cell>
      <Table.Cell width={1}>
        {comment.subreddit.length === 0 ? '' :
          <a onClick={openTab(subredditRedirectUrl)} href={subredditRedirectUrl}>{`r/${comment.subreddit}`}</a>}
      </Table.Cell>
      <Table.Cell width={4}>{moment(comment.lastViewedTime).fromNow()}</Table.Cell>
      <Table.Cell width={2}>0</Table.Cell>
      <Table.Cell width={2}>
        <Button basic color="red" size="mini">
          Unfollow
      </Button>
      </Table.Cell>
    </Table.Row>
  );
};


export default ViewingHistory;
