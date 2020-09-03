import React from "react";
import 'semantic-ui-css/semantic.min.css'
import '../style/filebrowser.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder, faFolderOpen, faFile, faCheck, faImage, faAngleLeft } from '@fortawesome/free-solid-svg-icons'
import Client from '../MinervaClient';

class Directory {
    constructor() {
        this.entries = [];
        this.path = null;
        this.isDir = true;
    }
}

export default class CloudBrowser extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            root: new Directory()
        }
        this.state.activeFolder = this.state.root;
        this.navigateBack = this.navigateBack.bind(this);
    }

    componentDidMount() {
        console.log('activeFolder: ', this.state.activeFolder);
        this.navigateRoot();
    }

    navigateRoot() {
        Client.getRepositories().then(response => {
            let repositories = response.included.repositories;
            let root = new Directory();
            root.entries = this.sortEntries(repositories);
            for (let entry of root.entries) {
                entry.isDir = true;
            }
            this.setState({root: root});
            this.setState({activeFolder: root});
        });
    }

    browse(repositoryUuid, parent=false) {
        return Client.listImagesInRepository(repositoryUuid).then(response => {
            return response;
        });
    }

    openItem(item, parent=false) {
        if (item.isDir) {
            this.browse(item.uuid, parent).then(response => {
                item.children = response.data;

                let activeFolder = new Directory();
                activeFolder.entries = this.sortEntries(response.data);
                activeFolder.path = response.path;

                this.setState({activeFolder: activeFolder});
                this.forceUpdate();
            });
        }
    }

    sortEntries(entries) {
        return this._sortByType(this._sortByName(entries));
    }

    _sortByType(items) {
        return items.sort((a, b) => {
            if (a.isDir && !b.isDir) {
                return -1;
            } else if (!a.isDir && b.isDir) {
                return 1;
            } else {
                return 0;
            }
        });
    }

    _sortByName(items) {
        return items.sort((a, b) => {
            return a.name.localeCompare(b.name);
        });
    }

    filter(items) {
        let filtered = [];
        for (let item of items) {
            if (item.isDir) {
                filtered.push(item);
            } else {
                let extension = this._getExtension(item.name);
                if (this.props.filter.includes(extension)) {
                    filtered.push(item);
                }
            }
        }
        return filtered;
    }

    _getExtension(filename) {
        return filename.substr(filename.lastIndexOf('.') + 1);
    }

    isImage(item) {
        let extension = this._getExtension(item.name);
        return ['tif', 'tiff', 'dat'].includes(extension); 
    }

    navigateBack() {
        this.navigateRoot();
    }

    selectFile(item) {
        this.props.onMinervaCloudUuid(item);
    }

    _getIconClass(item) {
        let iconClass = "image filebrowser-icon-";
        if (item.isDir) {
            iconClass += 'dir';
        } else {
            iconClass += 'file';
            if (this.isImage(item)) {
                iconClass += '-selectable';
            }
        }
        return iconClass;
    }

    render() {
        return (
            <div>
                <div className="filebrowser-location-bar">
                    <button type="button" onClick={this.navigateBack} className="ui button basic" disabled={this.state.activeFolder.isRoot}>
                        <FontAwesomeIcon icon={faAngleLeft} size="lg"/>
                    </button>
                    <span>{this.state.activeFolder.path}</span>
                </div>
                <div>
                    {this.renderDir(this.state.activeFolder)}
                </div>
            </div>
        );
    }

    renderDir(dir) {
        if (!dir || dir.entries.length === 0) {
            return null;
        }

        let contents = dir.entries.map((value, index) => {
 
            return (
                <div className="ui item filebrowser-item" onClick={() => this.openItem(value)} key={index}>
                    <div className={this._getIconClass(value)}>
                         {this.renderIcon(value)}
                    </div>
                    <div className="content ui grid">
                        <div className="seven wide column">
                            <h5>{value.name}</h5>
                        </div>
                        { value.uuid ? 
                            <div className="five wide column">
                               {value.uuid}
                            </div> : null
                        }

                    { this.renderSelectButton(value) }

                    </div>
                        
                </div>
            );
        });
        return (
            <div className="ui list">
                {contents}
            </div>
        );
    }

    renderIcon(item) {
        let icon = null;
        if (item.isDir) {
            icon = item.isOpen ? faFolderOpen : faFolder;
        } else {
            icon = this.isImage(item) ? faImage : faFile;
        }
        return (
            <FontAwesomeIcon icon={icon} size="2x" />
        );
    }

    renderSelectButton(item) {
        if (item.isDir) {
            return null;
        }
        if (this.props.filter) {
            let extension = item.name.substr(item.name.lastIndexOf('.') + 1);
            if (!this.props.filter.includes(extension)) {
                return null;
            }
        }
        return (
            <div className="four wide column">
            <button type="button" onClick={() => this.selectFile(item)} className="ui button primary">
                <FontAwesomeIcon icon={faCheck} />&nbsp;
                Select
            </button>
            </div>
        );
    }
}
