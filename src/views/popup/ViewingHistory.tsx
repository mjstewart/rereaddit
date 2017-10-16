import * as React from 'react';
import * as logging from '@js/logging';
import { Grid, Header, Button, Table } from 'semantic-ui-react';
import { Comment } from '@js/content-scripts/comments';
import * as moment from 'moment';
import * as sortby from 'lodash.sortby';
import { sendMessage, MessageType } from '@js/messages';
import { SortableField, SortDirection } from './Popup';

interface Props {
  comments: Comment[];
  sortField: SortableField;
  sortDirection: SortDirection;
  sortComments: (field: SortableField, direction: SortDirection) => void;
  deleteArticle: (articleId: string) => Promise<void>;
}

interface State {
  sortColumn?: SortableField;
  sortDirection?: SortDirection;
}

class ViewingHistory extends React.Component<Props, State> {
  constructor(props) {
    super(props);
  }

  deleteArticle = (articleId: string) => () => this.props.deleteArticle(articleId);

  handleSort = (clickedColumn: SortableField) => () => {
    const { sortField } = this.props;

    if (clickedColumn !== sortField) {
      this.props.sortComments(clickedColumn, SortDirection.Ascending);       
    } else {
      const direction = this.props.sortDirection === SortDirection.Ascending ? SortDirection.Descending : SortDirection.Ascending;
      this.props.sortComments(clickedColumn, direction);
    }
  }

  render() {
    const { comments, sortField, sortDirection } = this.props;
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
                  sorted={sortField === SortableField.Title ? sortDirection : undefined}
                  onClick={this.handleSort(SortableField.Title)}>
                  Title
                </Table.HeaderCell>
                <Table.HeaderCell
                  width={1}
                  sorted={sortField === SortableField.Sub ? sortDirection : undefined}
                  onClick={this.handleSort(SortableField.Sub)}>
                  Sub
                </Table.HeaderCell>
                <Table.HeaderCell
                  width={4}
                  sorted={sortField === SortableField.LastViewed ? sortDirection : undefined}
                  onClick={this.handleSort(SortableField.LastViewed)}>
                  Last viewed
                </Table.HeaderCell>
                <Table.HeaderCell
                  width={2}
                  sorted={sortField === SortableField.UnreadCount ? sortDirection : undefined}
                  onClick={this.handleSort(SortableField.UnreadCount)}
                  title={'Estimation of the total unread comments'}>
                  # Unread ?
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
  sendMessage({ url, type: MessageType.OPEN_TAB });
};


interface RowProps {
  comment: Comment;
  deleteArticle: (articleId: string) => () => Promise<void>;
}

const Row: React.SFC<RowProps> = ({ comment, deleteArticle }) => {
  const articleUrl = `https://www.reddit.com/r/${comment.subreddit}/comments/${comment.articleId}/?sort=new&limit=500`;
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
