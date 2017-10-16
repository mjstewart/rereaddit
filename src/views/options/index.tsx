require('./options.scss');
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import OptionsHome from '@views/options/OptionsHome';
import 'semantic-ui-css/semantic.min.css';

ReactDOM.render(<OptionsHome />, document.getElementById('root') as HTMLElement);
