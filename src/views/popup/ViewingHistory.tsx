import * as React from 'react';
import * as logging from '@js/logging';
import { Grid, Header, Button, Table } from 'semantic-ui-react';
import { Comment } from '@js/content-scripts/comments';
import * as moment from 'moment';
import * as sortby from 'lodash.sortby';
import { sendMessage, MessageType } from '@js/messages';

interface Props {
  comments: Comment[];
  setSortedComments: (comments: Comment[]) => void;
  deleteArticle: (articleId: string) => Promise<void>;
}

// Values correspond to the property in each Comment to sort by.
enum SortableColumn {
  Title = 'title',
  Sub = 'subreddit',
  LastViewed = 'lastViewedTime',
  UnreadCount = 'unreadCount',
}

enum Direction {
  Ascending = 'ascending',
  Descending = 'descending',
}

interface State {
  column: SortableColumn;
  direction: Direction;
}

class ViewingHistory extends React.Component<Props, State> {
  constructor(props) {
    super(props);

    // TODO: lift sort direction up to popup, it would be alot easier.
    this.state = {
      column: SortableColumn.UnreadCount,
      direction: Direction.Descending,
    };
  }

  

  deleteArticle = (articleId: string) => () => this.props.deleteArticle(articleId);

  handleSort = (clickedColumn: SortableColumn) => () => {
    const { column, direction } = this.state;
    const { setSortedComments } = this.props;

    if (clickedColumn !== column) {
      this.setState({
        column: clickedColumn,
        direction: Direction.Ascending,
      });

      switch (clickedColumn) {
        case SortableColumn.Title:
          setSortedComments(sortby(this.props.comments, (c: Comment) => c.title.toLowerCase()));
          break;
        case SortableColumn.Sub:
          setSortedComments(sortby(this.props.comments, [SortableColumn.Sub]));
          break;
        case SortableColumn.LastViewed:
          setSortedComments(sortby(this.props.comments, [SortableColumn.LastViewed]));
          break;
        case SortableColumn.UnreadCount:
          setSortedComments(sortby(this.props.comments, [SortableColumn.UnreadCount]));
          break;
      }
      return;
    }

    // Reverse direction when the same column is clicked again.
    this.setState({
      direction: direction === Direction.Ascending ? Direction.Descending : Direction.Ascending,
    });
    this.props.setSortedComments(this.props.comments.reverse());
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
                  sorted={column === SortableColumn.Title ? direction : undefined}
                  onClick={this.handleSort(SortableColumn.Title)}>
                  Title
                </Table.HeaderCell>
                <Table.HeaderCell
                  width={1}
                  sorted={column === SortableColumn.Sub ? direction : undefined}
                  onClick={this.handleSort(SortableColumn.Sub)}>
                  Sub
                </Table.HeaderCell>
                <Table.HeaderCell
                  width={4}
                  sorted={column === SortableColumn.LastViewed ? direction : undefined}
                  onClick={this.handleSort(SortableColumn.LastViewed)}>
                  Last viewed
                </Table.HeaderCell>
                <Table.HeaderCell
                  width={2}
                  sorted={column === SortableColumn.UnreadCount ? direction : undefined}
                  onClick={this.handleSort(SortableColumn.UnreadCount)}>
                  # Unread
                </Table.HeaderCell>
                <Table.HeaderCell width={2}>Unfollow</Table.HeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {comments.map(comment =>
                <Row
                  key={comment.articleId}
                  comment={comment}
                  deleteArticle={this.deleteArticle}
                />)}
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


interface RowProps {
  comment: Comment;
  deleteArticle: (articleId: string) => () => Promise<void>;
}

const Row: React.SFC<RowProps> = ({ comment, deleteArticle }) => {
  const articleUrl = `https://www.reddit.com/r/${comment.subreddit}/comments/${comment.articleId}`;
  const subredditRedirectUrl = `https://www.reddit.com/r/${comment.subreddit}`;

  return (
    <Table.Row>
      <Table.Cell width={7}>
        <a onClick={openTab(articleUrl)} href={articleUrl}>
          {shortenTitle(comment.title)}
        </a>
      </Table.Cell>
      <Table.Cell width={1}>
        {comment.subreddit.length === 0 ? '' :
          <a onClick={openTab(subredditRedirectUrl)} href={subredditRedirectUrl}>{`r/${comment.subreddit}`}</a>}
      </Table.Cell>
      <Table.Cell width={4}>{moment(new Date(comment.lastViewedTime)).fromNow()}</Table.Cell>
      <Table.Cell width={2}>{comment.unread}</Table.Cell>
      <Table.Cell width={2}>
        <Button basic color="red" size="mini" onClick={deleteArticle(comment.articleId)}>Unfollow</Button>
      </Table.Cell>
    </Table.Row>
  );
};

export default ViewingHistory;
