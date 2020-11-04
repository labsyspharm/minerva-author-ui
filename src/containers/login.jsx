import React from 'react';
import '../style/login.css';
import alertify from 'alertifyjs';
import 'alertifyjs/build/css/alertify.min.css';
import {
    CognitoUser,
    AuthenticationDetails
} from 'amazon-cognito-identity-js';
import login from '../login';
import Loader from '../components/loader';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner, faBackward, faEnvelope, faKey } from '@fortawesome/free-solid-svg-icons'

class LoginPage extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            loggedIn: false,
            loggedInUser: null,
            warning: null,
            loginSpinner: false,
            showLoginForm: true,
            showPasswordChange: false,
            showPasswordReset: false,
            password: null,
            passwordConfirmation: null,
            forcedPasswordResponse: null
        };

        this.login = this.login.bind(this);
        this.changePassword = this.changePassword.bind(this);
        this.enterPressed = this.enterPressed.bind(this);
        this.forgotPassword = this.forgotPassword.bind(this);
        this.anonymousLogin = this.anonymousLogin.bind(this);
        this.resetPassword = this.resetPassword.bind(this);
        this.showForm = this.showForm.bind(this);
        this.handleChange = this.handleChange.bind(this);
    }

    changePassword() {
        if (this.state.password !== this.state.passwordConfirmation) {
            this.setState({warning: 'New password and confirmation do not match.'});
            return;
        }
        console.log(this.state.forcedPasswordResponse);
        let userAttributes = this.state.forcedPasswordResponse.fields;
        userAttributes.name = userAttributes.email;
        userAttributes.preferred_username = userAttributes.name;
        delete userAttributes.email_verified;
        this.state.cognitoUser.completeNewPasswordChallenge(this.state.password, userAttributes, {
            onSuccess: (data) => this.passwordChallengeSuccess(data),
            onFailure: err => {
                console.error(err);
                this.setState({warning: 'Password minimum length is 8 and it must contain one lowercase, uppercase and number.'});
            }
          });
    }

    passwordChallengeSuccess(data) {
        this.setState({ loggedIn: true, loggedInUser: this.state.username });
        localStorage.setItem('loggedInUser', this.state.username);
        alertify.success("Login success", 2);
        this.props.onToken({
            token: cognitoUser.signInUserSession.idToken.jwtToken,
            user: cognitoUser
        });
    }

    handleChange(evt) {
        const value =
            evt.target.type === "checkbox" ? evt.target.checked : evt.target.value;
        this.setState({
            ...this.state,
            [evt.target.name]: value
        });
    }

    login() {
        const cognitoUser = new CognitoUser({
            Username: this.state.username,
            Pool: login.getUserPool(),
            Storage: login.getCookieStorage()
        });

        const authenticationDetails = new AuthenticationDetails({
            Username: this.state.username,
            Password: this.state.password
        });

        this.setState({loginSpinner: true});

        const auth = new Promise((resolve, reject) => {
            cognitoUser.authenticateUser(authenticationDetails, {
                onSuccess: result => resolve(result),
                onFailure: err => reject(err),
                mfaRequired: codeDeliveryDetails => reject(codeDeliveryDetails),
                newPasswordRequired: (fields, required) => reject({ fields, required })
            });
        });

        this._token = auth
            .then(response => {
                this.setState({ loggedIn: true, loggedInUser: this.state.username, warning: null, loginSpinner: false });
                localStorage.setItem('loggedInUser', this.state.username);
                this.props.onToken({
                    token: cognitoUser.signInUserSession.idToken.jwtToken,
                    user: cognitoUser
                });
            }).catch(err => {
                this.setState({loginSpinner: false});
                if (err.fields && err.required) {
                    this.showForm('change');
                    this.setState({ 
                                forcedPasswordResponse: err,
                                warning: 'You must update your password before continuing.',
                                cognitoUser: cognitoUser
                            });
                } else {
                    console.error(err);
                    this.setState({warning: 'Invalid Email or Password.'});
                }
            });
    };

    anonymousLogin() {
        const cognitoUser = new CognitoUser({
            Username: '00000000-0000-0000-0000-000000000000',
            Pool: login.getUserPool(),
            Storage: login.getCookieStorage()
        });
        this.props.onToken(cognitoUser);
    }

    showForm(formName) {
        this.setState({showLoginForm: false, showPasswordChange: false, showPasswordReset: false, warning: ''});
        switch (formName) {
            case 'login':
                this.setState({showLoginForm: true});
                break;
            case 'change':
                this.setState({showPasswordChange: true});
                break;
            case 'reset':
                this.setState({showPasswordReset: true});
                break;
        }
    }

    enterPressed(evt) {
        if (evt.key === "Enter") {
            this.login();
        }
    }

    forgotPassword() {
        if (!this.state.username) {
            alertify.warning('Input your email or phone first.');
            return;
        }
        let cognitoUser = new CognitoUser({
            Username: this.state.username,
            Pool: login.getUserPool(),
            Storage: login.getCookieStorage()
        });

        cognitoUser.forgotPassword({
            onSuccess: (result) => {
                console.log('call result: ' + result);
                this.setState({warning: 'You have been sent an email which contains verification code to reset your password.'});
                this.showForm('reset');
            },
            onFailure: (err) => {
                alertify.error(err.message);
            }
        });
    }

    resetPassword() {
        if (!this.state.verificationCode) {
            alertify.error("Please enter your verification code first.");
            return;
        }
        if (this.state.password !== this.state.passwordConfirmation) {
            this.setState({warning: 'New password and confirmation do not match.'});
            return;
        }
        let cognitoUser = new CognitoUser({
            Username: this.state.username,
            Pool: login.getUserPool(),
            Storage: login.getCookieStorage()
        });
        let self = this;
        cognitoUser.confirmPassword(this.state.verificationCode, this.state.password, {
            onFailure(err) {
                alertify.error(err.message);
            },
            onSuccess() {
                alertify.message('Please login with your new password.');
                self.showForm('login');
                self.setState({warning: 'You can now sign in with your new password.'});
            },
        });
    }

    render() {
        return (
            <div className="loginPage">
            <div className="loginContainer">
                { this.state.showLoginForm ? this.renderLoginForm() : null }
                { this.state.showPasswordChange ? this.renderPasswordChange() : null }
                { this.state.showPasswordReset ? this.renderPasswordReset() : null }
                { this.state.warning ? (
                    <div className="alert alert-warning mt-3" role="alert">
                        {this.state.warning}
                    </div> ) 
                : null }
                <Loader active={this.state.loginSpinner} /> 
            </div>
            </div>
        );
    }

    renderLoginForm() {
        return (
        <form className="loginForm">
            <h2 className="h2 mb-4">
                <img width="300px" src="image/Minerva_FinalLogo_RGB.svg"></img>
            </h2>
            <div className="loginForm">
            <div className="input-group mb-3">
                <div className="input-group-prepend">
                    <span className="input-group-text" id="basic-addon1"><FontAwesomeIcon icon={faEnvelope} /></span>
                </div>
                <input type="email" className="form-control" placeholder="Email or Phone" id="username" name="username" onChange={this.handleChange} aria-describedby="emailHelp"/>
            </div>
            <div className="input-group mb-3">
                <div className="input-group-prepend">
                    <span className="input-group-text" id="basic-addon1"><FontAwesomeIcon icon={faKey} /></span>
                </div>
                <input type="password" className="form-control" placeholder="Password" id="password" name="password" onChange={this.handleChange} onKeyPress={this.enterPressed} aria-describedby="emailHelp"/>
            </div>
            <button type="button" className="btn form-control btn-primary mb-3" disabled={this.state.loginSpinner} onClick={this.login}>Sign in
            </button>
            <a href="#" onClick={this.forgotPassword}>Forgot your password?</a><br></br>
            { this.props.allowGuest ? 
                <button type="button" className="btn form-control btn-outline-light mt-3" onClick={this.anonymousLogin}>Continue as Guest
                </button>
            : null }
            
            </div>
            
        </form>
        );
    }

    
    renderPasswordChange() {
        return (
        <form>
            <h3 className="h3 mb-3">
                <a className="float-left" href="#" onClick={() => this.showForm('login')}><FontAwesomeIcon icon={faBackward} /></a>
                Update Password
            </h3>
            <div className="loginForm">
            <div className="form-group">
                <input type="password" className="form-control" placeholder="New Password" id="password" name="password" onChange={this.handleChange} aria-describedby="emailHelp"/>
            </div>
            <div className="form-group">
                <input type="password" className="form-control" placeholder="New Password (confirmation)" id="password" name="passwordConfirmation" onChange={this.handleChange} aria-describedby="emailHelp"/>
            </div>
            <button type="button" className="btn form-control btn-primary" onClick={this.changePassword}>Update Password
            </button>
            </div>
        </form>
        );
    }

    renderPasswordReset() {
        return (
            <form>
                <h3 className="ui h3 mb-3 inverted">
                    <a className="float-left" href="#" onClick={() => this.showForm('login')}><FontAwesomeIcon icon={faBackward} /></a>
                    Reset Password
                </h3>
                <div className="loginForm">
                <div className="form-group">
                    <input type="number" className="form-control" placeholder="Verification code" id="code" name="verificationCode" onChange={this.handleChange} aria-describedby="emailHelp"/>
                </div>
                <div className="form-group">
                    <input type="password" className="form-control" placeholder="New Password" id="password" name="password" onChange={this.handleChange} aria-describedby="emailHelp"/>
                </div>
                <div className="form-group">
                    <input type="password" className="form-control" placeholder="New Password (confirmation)" id="password" name="passwordConfirmation" onChange={this.handleChange} aria-describedby="emailHelp"/>
                </div>
                <button type="button" className="btn form-control btn-primary" onClick={this.resetPassword}>Reset Password
                </button>
                </div>
            </form>
            );
    }
}

export default LoginPage;
