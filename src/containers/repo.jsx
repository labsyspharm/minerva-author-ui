import React, { Component } from "react";

import ImageView from "./imageview";
import ChannelControls from "./channelcontrols";
import ImportList from "../components/importlist";
import Import from "../components/import";
import Banner from "../components/Banner";
import Modal from "../components/modal";
import api from "../api";

import '../style/repo';

class Repo extends Component {

  constructor() {
    super();
    this.state = {
      session: null,
			imps: new Map(),
			imgs: new Map(),
			'active': {
				uuid: undefined,
				channels: new Map(),
        credentialsHolder: {
          credentials: null
        }
			},
      'modal': {
        onClose: this.toggleModal.bind(this, false),
        action: 'Close',
        title: 'Message',
        fields: [],
        show: false,
        body: ''
      },
      'repository': '43465e43-a8be-4aa3-88af-0db3d9aad6f2'
    };

    // Bind
    this.handleChange = this.handleChange.bind(this);
    this.handleLogin = this.handleLogin.bind(this);
  }

	getActive(img, session) {

		const channels = new Map();
    const {token} = session;

		const getColor = i => {
			return [
			[0,0,255],[0,127,255],[0,255,0],[0,255,127],[0,255,255],
			[127,0,255],[127,127,127],[127,127,255],[127,255,0],[127,255,127],
			[255,0,0],[255,0,127],[255,0,255],[255,127,0],[255,127,127],[255,255,0]
			][i % 16]
		}

    const maxRange = 65535;
    const minRange = 0;
    const range = {
      min: minRange,
      max: maxRange
    }

		const randInt = n => Math.floor(Math.random() * n);
		for (let id of Array(randInt(4)+1).keys()) {

      const color = getColor(id);

      // Add to channel map
  		channels.set(id, {
				id,
        color,
        range,
        minRange,
        maxRange
			});
		}

    // Return active image withcredentials
    return api.getImageCredentials(img.uuid, token)
      .then(credentials => {
        return {
          uuid: img.uuid,
          channels: channels,
          credentialsHolder: {credentials}
        }
      });
	}

  handleChange(id, color, range) {
    const { active } = this.state;
    const { channels } = active;
    const channel = channels.get(id);

    const newChannel = { ...channel };
    if (color) {
      newChannel['color'] = color;
    }
    if (range) {
      newChannel['range'] = range;
    }
    const newChannels = new Map([...channels,
                                 ...(new Map([[id, newChannel]]))]);
    const newActive = { ...this.state['active'], channels: newChannels };

    this.setState({
      active: newActive
    });
  }

  toggleModal(show) {
    this.setState({
      modal: {
        ...this.state.modal,
      show
      }
    });
  }

  handleLoginError(error) {
    const {modal} = this.state;
    const {name, message, retry} = error;
    var onClose = this.toggleModal.bind(this, false);
    var action = "Close";
    var fields = [];
    var body = '';

    // Close the modal then retry
    if (retry) {
      onClose = (userInput) => {
        this.toggleModal(false);

        // Sucessfully set the session
        retry(userInput).then(session => {
          this.setState({
            modal: {...modal},
            session,
          })
        }).catch(e => {
          this.handleLoginError(e);
        });
      }
    }

    switch(name) {
      case "PasswordResetException":
        fields = error.required || [];
        action = "Reset";
        break;
      case "PasswordResetRequiredException":
        body = "Enter code or leave blank to resend:"
        fields = error.required || [];
        action = "Verify";
        break;
      default:
    }

    this.setState({
      modal: {
        show: true,
        body: body,
        title: message,
        fields: fields,
        onClose: onClose,
        action: action
      }
    });

  }

  handleLogin(userInput) {
    // Take from env file if possible
    const email = userInput.email || process.env.EMAIL;
    const password = userInput.password || process.env.PASSWORD;

    api.login(email, password)
      .then(session => {
        const {repository, active} = this.state;
        const {token} = session;
        this.setState({session});
        // Load the imports
        api.getImports(repository, token)
        .then(imports => {
          imports.map(imp => {
            api.getImages(imp.uuid, token).then(images => {

              (a => {
                const newImgs = new Map([
                  ...this.state.imgs,
                  ...images.map(img => [img.uuid, img])
                ]);
                const newImps = new Map([
                  ...this.state.imps,
                  [imp.uuid, {...imp,
                    imgs: images.map(img => img.uuid)
                  }]
                ]);

                // Set active if first image
                if (a.id === undefined && images.length > 0) {
                  return this.getActive(images[0], session)
                    .then(active => {
                      return {
                        active,
                        imgs: newImgs,
                        imps: newImps
                      };
                    });
                }
                return Promise.resolve({
                  imgs: newImgs,
                  imps: newImps
                });
              })(active).then(this.setState.bind(this));
            });
          });
        });
      })
      .catch(e => {
        this.handleLoginError(e);
      });
  }

  addImages(userInput) {
    this.toggleModal(false);

    if (this.state.session === null) {
      this.setState({
        modal: {
          fields: [],
          show: true,
          title: "Error",
          body: "You must login.",
          onClose: this.toggleModal.bind(this, false),
          action: "Close"
        }
      }); 
      return;
    }

    const {token} = this.state.session;

    api.addImport(userInput, token)
      .then(uuid => {
        this.setState({
          modal: {
            fields: [],
            show: true,
            action: "Confirm",
            title: "Confirm Images Exist",
            body: `In the S3 bucket, images must exist
              in this folder for the import: ` + uuid,
            onClose: () => {
              this.toggleModal(false);
              api.confirmImport(uuid, token)
                .then(r => console.log(r))
                .catch(e => console.error(e));
            }
          }
        }); 
      }).catch(e => {
        console.error(e);
      });
  }

  onError (e) {
    this.setState({
      modal: {
        fields: [],
        show: true,
        title: "Error",
        body: e.message,
        onClose: this.toggleModal.bind(this, false),
        action: "Close"
      }
    });
  }

  render() {
    const { session, imps, imgs, active } = this.state;
    const { modal } = this.state;

    const img = imgs.get(active.uuid);
		const { channels, credentialsHolder } = active;

    return (
      <React.Fragment>
        <Modal show={modal.show} title={modal.title}
          action={modal.action} fields={modal.fields}
          onClose={modal.onClose.bind(this)}>
        {modal.body}
        </Modal>
        <ImageView className="ImageView"
          img={ img }
          channels={ channels }
          onError={this.onError.bind(this)}
          credentialsHolder={ credentialsHolder }
        />
        <Banner session={ session }
                addImages={ ()=> {
                  this.setState({
                    modal: {
                      show: true,
                      title: "Add Images",
                      body: "Name a repository and import.",
                      fields: [
                        "repository_name",
                        "import_name",
                      ],
                      onClose: this.addImages.bind(this),
                      action: "Add"
                    }
                  }) 
                }}
                handleLogin={ ()=> {
                  this.setState({
                    modal: {
                      show: true,
                      title: "Login to Minerva",
                      fields: [
                        "email",
                        "password"
                      ],
                      onClose: (userInput) => {
                        this.toggleModal(false);
                        this.handleLogin(userInput);
                      },
                      action: "Login"
                    }
                  });
                }}
                handleLogout={ () => console.log('logout') } />
        <div className="container-fluid Repo">

          <div className="row justify-content-between">
            <ImportList className="ImportList col-md-2">
              {Array.from(imps.entries()).map(entry => {
                const [uuid, imp] = entry;
                return (
                  <Import key={uuid}
                  click={img => {
                    this.getActive(img, session).then(active => {
                      this.setState({active});
                    });
                  }}
                  imgs={imgs} imp={imp}/>
                );
              })}
            </ImportList>

            <ChannelControls className="ChannelControls col-md-3"
              channels={ channels }
              handleChange={ this.handleChange }
            />
          </div>
        </div>
      </React.Fragment>
    );
  }
}

export default Repo;
