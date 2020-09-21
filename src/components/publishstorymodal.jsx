import React from 'react';
import Client from '../MinervaClient';

export default class PublishStoryModal extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            published: false,
            publishButtonDisabled: false,
            error: null,
            bucket: null,
            key: null,
            storyUrl: null
        }
    }

    publish() {
        this.setState({publishing: true });

        Client.publishStory(this.props.storyUuid).then(res => {
            this.setState({
                publishing: false,
                published: true,
                bucket: res.bucket,
                key: res.key,
                storyUrl: res.url
            });
            console.log(res);
            setTimeout(() => { this.setState({publishButtonDisabled: false})}, 30000);
          }).catch(err => {
            this.setState({publishing: false, published: false, error: err});
            console.error(err);
          });
    }

    close() {
        this.props.onClose();
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
                        Publishing the story will create a standalone Minerva Story in S3 bucket.
                        Access to the bucket is <strong>public</strong>.
                    </p>
                    { this.renderPublishedInfo() }

                    <p className="red">
                        { this.state.error }
                    </p>
                </div>
                <div className="actions">
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
        //let downloadText = `aws s3 sync s3://${this.state.bucket}/${this.state.key} <local_destination>`;;
        return (
            <div>
            <p>
                The story is being exported, this will take a few minutes.
            </p>
            <p>
                <a className="ui button primary" href={this.state.storyUrl} target="_blank">Click to open the story</a>
            </p>
            </div>
        );
    }
}