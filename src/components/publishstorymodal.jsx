import React from 'react';
import Client from '../MinervaClient';
import Loader from '../components/loader';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons'

export default class PublishStoryModal extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            published: false,
            publishButtonDisabled: false,
            error: null,
            bucket: null,
            key: null,
            storyUrl: null,
            renderImages: true,
            status: null
        }

        this.renderImagesChanged = this.renderImagesChanged.bind(this);
        this.statusPolling = null;
    }

    componentDidMount() {
        this.updateStatus();
    }

    updateStatus() {
        Client.getStoryStatus(this.props.storyUuid).then(res => {
            this.setState({
                status: res.status,
                storyUrl: res.url
            });
            if (res.status !== 'processing' && this.statusPolling) {
                clearInterval(this.statusPolling);
            }
        });
    }

    startStatusPolling() {
        this.statusPolling = setInterval(this.updateStatus, 5000);
    }

    publish() {
        this.setState({publishing: true, publishButtonDisabled: true });

        Client.publishStory(this.props.storyUuid, this.state.renderImages).then(res => {
            this.setState({
                publishing: false,
                published: true,
                bucket: res.bucket,
                key: res.key,
                storyUrl: res.url,
                error: null
            });
            console.log(res);
            setTimeout(() => { this.setState({publishButtonDisabled: false})}, 5000);
            this.startStatusPolling();
          }).catch(err => {
            let errorObj = JSON.parse(err.message);
            this.setState({publishing: false, 
                published: false, 
                publishButtonDisabled: false,
                error: errorObj.error});
            console.error(err);
          });
    }

    close() {
        this.props.onClose();
    }

    renderImagesChanged(evt) {
        console.log(evt);
        this.setState({ renderImages: !this.state.renderImages });
    }

    render() {
        let modalClass = "ui modal";
        if (this.props.active) {
            modalClass += " active";
        }
        return (
            <div className={modalClass}>
                <div className="header">Publish story</div>
                <div className="content inverted">
                    <p>
                        Publishing the story will create a standalone Minerva Story website hosted in AWS S3 bucket.
                    </p>
                    <p>
                        The website will be <strong>accessible to public</strong>.
                    </p>
                    <p>
                        Status of this story is <strong>{this.state.status}</strong>
                    </p>
                    { this.renderPublishedInfo() }
                    { this.renderOpenStoryButton() }
                    { this.state.error ?
                        <p className="red">
                            ERROR: { this.state.error }
                        </p>
                        : null
                    }
                </div>
                <div className="actions">
                    <div className="ui toggle checkbox">
                        <input type="checkbox" checked={this.state.renderImages} name="renderImages" onChange={this.renderImagesChanged} />
                        <label>Render image tiles</label>
                    </div>
                    <button type="button" className="ui primary button" disabled={this.state.publishButtonDisabled} onClick={() => this.publish()}>Publish</button>
                    <button type="button" className="ui cancel button" onClick={() => this.close()}>Close</button>
                </div>
            </div>
        );
    }

    renderPublishedInfo() {
        if (!this.state.published) {
            return null;
        }
        return (
            <div>
            <p>
                The story has been published. (Rendering all tiles may take a few minutes.) <Loader active={this.state.publishButtonDisabled} />
            </p>
            </div>
        );
    }

    renderOpenStoryButton() {
        if (!this.state.status || this.state.status === 'unpublished') {
            return null;
        }
        return (
            <a className="ui button primary" href={this.state.storyUrl} target="_blank">
                Open the Story &nbsp;
                <FontAwesomeIcon icon={faExternalLinkAlt} />
            </a>
        );
    }
}