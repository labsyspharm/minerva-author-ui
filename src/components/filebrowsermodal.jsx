import React from 'react';
import { Modal } from 'semantic-ui-react';
import FileBrowser from './filebrowser';
import '../style/filebrowser.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons'


export default class FileBrowserModal extends React.Component {
    render() {
        return (
            <Modal open={this.props.open} centered={false}>
                <Modal.Header>
                    {this.props.title}
                    <button type="button" className="ui button filebrowser-modal-close" onClick={this.props.close}>
                        <FontAwesomeIcon icon={faTimes} size="lg"/>
                    </button>
                </Modal.Header>
                <Modal.Content>
                    <FileBrowser onFileSelected={this.props.onFileSelected} 
                        filter={this.props.filter} 
                        home={this.props.home} />
                </Modal.Content>
            </Modal>
        );
    }
}