require('./popup.scss');
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Popup from '@views/popup/Popup';
import 'semantic-ui-css/semantic.min.css';


ReactDOM.render(<Popup />, document.getElementById('root') as HTMLElement);
