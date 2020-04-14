import React from 'react';
import { Modal, Popup } from 'semantic-ui-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSignInAlt } from '@fortawesome/free-solid-svg-icons'
import authenticate from '../login';
import { Button, Form, Grid, Header, Image, Message, Segment } from 'semantic-ui-react'
import MinervaConfig from '../config';
import '../style/signin.css';

export default class SignIn extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            showModal: false,
            message: '',
            showMessage: false,
            email: '',
            password: '',
            success: false
        }

        this.handleChange = this.handleChange.bind(this);
        this.signIn = this.signIn.bind(this);
        this.inputRef = React.createRef();
    }

    handleChange(evt) {
        const value =
            evt.target.type === "checkbox" ? evt.target.checked : evt.target.value;
        this.setState({
            ...this.state,
            [evt.target.name]: value
        });
    }

    open() {
        this.setState({showModal: true});
    }

    close() {
        this.setState({showModal: false});
    }

    signIn() {
        this.setState({message: '', showMessage: false});

        authenticate(this.state.email, this.state.password).then(token => {
            this.setState({showModal: false, success: true});
            this.props.onToken(token);
        }).catch(err => {
            console.error(err);
            this.setState({message: 'Invalid email or password', showMessage: true});
        });
    }

    render() {
        if (!MinervaConfig.enableCloudFeatures) {
            return null;
        }
        return (
            <div>
                <div className="signin-button">
                    { this.state.success ? 
                        <span className="ui label">{this.state.email}</span>
                        :
                        <button className="ui circular icon mini button" onClick={() => this.open()}>
                            <FontAwesomeIcon icon={faSignInAlt} size="lg"/>
                        </button>
                    }
                </div>

                <Modal open={this.state.showModal} className="minerva-signin">
                <Modal.Header>
                    Sign in Minerva
                    <button type="button" className="ui button filebrowser-modal-close" onClick={() => this.close()}>
                        <FontAwesomeIcon icon={faTimes} size="lg"/>
                    </button>
                </Modal.Header>
                <Modal.Content>
                <Grid textAlign='center' verticalAlign='middle'>
                <Grid.Column style={{ maxWidth: 450 }}>
                <Header as='h2' color='teal' textAlign='center'>
                    Sign in Minerva
                </Header>
                <Form size='large'>
                    <Segment stacked>
                    <Form.Input 
                        fluid 
                        name='email'
                        placeholder='E-mail address'
                        value={this.state.email}    
                        onChange={this.handleChange}
                    />
                    <Form.Input
                        fluid
                        name='password'
                        placeholder='Password'
                        type='password'
                        value={this.state.password}
                        onChange={this.handleChange}
                    />
                    <Button color='blue' fluid size='large' onClick={this.signIn}>
                        Sign in
                    </Button>
                    </Segment>
                </Form>
                { this.state.showMessage ? 
                    <Message>
                        {this.state.message}
                    </Message> 
                : null }
                </Grid.Column>
            </Grid>
                    <Popup
                        context={this.inputRef}
                        content={this.state.message}
                        position='top center'
                        open={this.state.messageOpen}
                    />
                </Modal.Content>
            </Modal>
            </div>
        );
    }
}