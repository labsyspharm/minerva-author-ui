import React from 'react';
import { Modal, Popup } from 'semantic-ui-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSignInAlt, faSignOutAlt } from '@fortawesome/free-solid-svg-icons'
import login from '../login';
import { Button, Form, Grid, Header, Message, Segment, Dimmer } from 'semantic-ui-react'
import '../style/signin.css';
import Loader from '../components/loader';

export default class SignIn extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            showModal: false,
            message: '',
            showMessage: false,
            email: '',
            password: '',
            success: false,
            loading: false,
            triedStoredLogin: false
        }

        this.handleChange = this.handleChange.bind(this);
        this.signIn = this.signIn.bind(this);
        this.signOut = this.signOut.bind(this);
        this.inputRef = React.createRef();
    }

    componentDidMount() {
        if (!this.state.triedStoredLogin) {
            this.setState({triedStoredLogin: true});
            // Check if there is previous authentication stored in local storage
            login.storedAuthentication().then(user => {
                user.getUserData((err, userData) => {
                    if (err) {
                        console.error(err);
                        return;
                    }
                    let email = '';
                    for (let attribute of userData.UserAttributes) {
                        if (attribute.Name == 'email') {
                            email = attribute.Value;
                        }
                    }
                    this.setState({success: true, email: email});
                    this.props.onToken({
                        token: user.signInUserSession.idToken.jwtToken,
                        user: user
                    });
                });

            }).catch(err => {
                console.log(err);
            });
        }
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
        this.setState({message: '', showMessage: false, loading: true});

        login.authenticate(this.state.email, this.state.password).then(token => {
            this.setState({showModal: false, success: true, loading: false});
            this.props.onToken(token);
        }).catch(err => {
            console.error(err);
            this.setState({message: err.message, showMessage: true, loading: false});
        });
    }

    signOut() {
        login.logout();
        this.setState({success: false});
        console.log(this.props);
        this.props.onSignout();
    }

    render() {
        return (
            <div>
                { this.state.success ? 
                    this.renderLogoutFields() :
                    this.renderLoginFields()
                }
                { this.renderErrorMessage() }
            </div>
        )
    }

    renderErrorMessage() {
        if (!this.state.message) {
            return null;
        }
        return (
            <div class="ui error message">
            <div class="header">{this.state.message}</div>
            </div>
        );
    }

    renderLoginFields() {
        return (
            <div className="ui form">
                <div className="three fields">
                <div className="field">
                <input type="email" 
                    value={this.state.email} 
                    onChange={this.handleChange}
                    placeholder='E-mail address'
                    name='email' />
            </div>
            <div className="field">
                <input type="password" 
                    value={this.state.password} 
                    onChange={this.handleChange}
                    placeholder='Password'
                    name='password' />   
            </div> 
            <div className="field">
            <button className="ui button primary" 
                type="button" 
                disabled={this.state.loading}
                onClick={this.signIn}>
                    Sign in
                    &nbsp;<FontAwesomeIcon icon={faSignInAlt} size="lg" />
            </button>
            <Loader active={this.state.loading} />
            </div>
            </div>
        </div>
        );
    }

    renderLogoutFields() {
        return (
            <div className="signout-button">
            <div className="ui animated button" disabled={this.state.loading}
            onClick={this.signOut}>
                <span className="visible content">Signed in<br/> {this.state.email}</span>
                <div className="hidden content">
                    <FontAwesomeIcon icon={faSignOutAlt} size="lg" />&nbsp;Sign out
                </div>

            </div>
            </div>
        );
    }

}