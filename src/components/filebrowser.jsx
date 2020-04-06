import React from "react";
import 'semantic-ui-css/semantic.min.css'
import '../style/filebrowser.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder, faFolderOpen, faFile, faCheck, faImage, faAngleLeft } from '@fortawesome/free-solid-svg-icons'

class Directory {
    constructor() {
        this.entries = [];
        this.path = null;
        this.isDir = true;
    }
}

export default class FileBrowser extends React.Component {

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
        let home = this.props.home || '';
        this.browse(home).then(response => {
            let root = new Directory();
            root.entries = this.sortEntries(response.entries);
            root.path = response.path;
            this.setState({root: root});
            this.setState({activeFolder: root});
        });
    }

    browse(path, parent=false) {
        let parameter = 'path=' + path;
        if (parent) {
            parameter += '&parent=true';
        }
        return fetch('http://127.0.0.1:2020/api/filebrowser?' + parameter)
            .then(response => {
                console.log(response);
                return response.json();
            });
    }

    openItem(item, parent=false) {
        if (item.isDir) {
            this.browse(item.path, parent).then(response => {
                item.children = response.entries;

                let activeFolder = new Directory();
                activeFolder.entries = this.sortEntries(response.entries);
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

    _formatSize(size) {
        if (!size) {
            return '';
        }
        if (size < 1000) {
            return size + ' bytes';
        } else if (size < 1000000) {
            return (size/1000).toFixed(1) + ' KB';
        } else if (size < 1000000000) {
            return (size/1000000).toFixed(1) + ' MB';
        } else {
            return (size/1000000000).toFixed(1) + ' GB';
        }
    }

    isImage(item) {
        let extension = this._getExtension(item.name);
        return ['tif', 'tiff', 'dat'].includes(extension); 
    }

    navigateBack() {
        this.openItem(this.state.activeFolder, true);
    }

    selectFile(item) {
        this.props.onFileSelected(item, this.state.activeFolder.path);
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
                <div className="ui card filebrowser-item" onClick={() => this.openItem(value)} key={index}>
                    <div className={this._getIconClass(value)}>
                         {this.renderIcon(value)}
                    </div>
                    <div className="content">
                        <div className="header">
                            <h5>{value.name}</h5>
                        </div>
                        { value.size ? 
                            <div className="meta">
                                Size: {this._formatSize(value.size)}
                            </div> : null
                        }
                    </div>
                    
                    { this.renderSelectButton(value) }
                        
                </div>
            );
        });
        return (
            <div className="ui four cards">
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
            <FontAwesomeIcon icon={icon} size="4x" />
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
            <div className="extra content">
            <button type="button" onClick={() => this.selectFile(item)} className="ui button primary">
                <FontAwesomeIcon icon={faCheck} />&nbsp;
                Select
            </button>
            </div>
        );
    }
}