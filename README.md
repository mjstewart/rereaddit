# rereaddit

Is a chrome extension to track and manage unread reddit comments.

This extension tracks your last visit time for each visited thread. The next time you visit the thread,
all new comments posted after your last visit time are highlighted for easy identification. 

The motivation for this extension is to provide a visual way to identify new comments. If you have ever tried to sort comments by 'new', you
would have noticed new nested comments are hard to identify because reddit only sorts by root comments, not new children.

# Features

- Highlight all unread comments since your last visit to a thread.
- Click unread comment to remove highlighting.
- Dashboard to view all visiting history including total unread comments and sortable fields.
- Extension data is stored using chromes synchronized storage system which means all your viewing history will synchronized across devices.
- Full control over clearing viewing history or unfollowing specific threads.
- Automatically clears history at preset intervals to avoid exceeding browser storage limits.
- Automatically follow all visited threads or opt out and use manual following for complete control.
- Many configurable options

# Configurable options

Access via 
1. Click on the extension icon in top right of your browser and click options.
2. Navigate to `chrome://extensions` in your browser and look for `rereaddit`

- Change unread comment highlight color
- Change how frequently viewing history is deleted (settings are kept).
- Automatically or manually follow threads (see Usage section).

# Usage
The extension icon in the top right of the browser which opens the dashboard is only active only when you visit reddit.

- If 'Auto follow articles I visit' option is enabled, each time you visit a thread the visit time will be saved to calculate future unread comments.
- If 'Auto follow articles I visit' is disabled, no threads will be followed unless you click the 'follow' button below the threads title.

If you are unsure which articles you are following, click the extension icon to open the dashboard (ensure you are on reddit).
You can unfollow a thread through the dashboard or by the unfollow button below the threads title if manual following is enabled. 

# Limitations
Currently, its possible that not all unread comments will be identified which will be the case in threads with over 500 comments.
You may have noticed threads containing many comments will have links to 'load more comments' or 'continue this thread' to reduce server load.

The current implementation does not recursively follow these links and only considers comments in the current html page. In future versions this may change.
This means the dashboards unread comment count is only an estimation.

# FAQ
- I visited a thread a day ago but its no longer in my dashboard?

It's possible the extension has deleted the thread from storage as you did not revisit it within the day configured in the settings. 

- Highlights for unread comments are slow to show up

Comment highlighting only occurs once the page is completely loaded and depends on how fast your network speed is or the reddit servers.

- Why is the dashboard taking a while to load?

The more threads you are tracking unread comments for, the slower the dashboard will take to load. This is because all threads are scanned
to find the estimated unread comment count.

# Built with
- Typescript
- react
- webpack
- [semantic-ui-react](https://react.semantic-ui.com)
- sass
- [sinon-chrome](https://github.com/acvetkov/sinon-chrome)