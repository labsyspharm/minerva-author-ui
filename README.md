# Minerva Author UI

<img width="500px" src="./static/images/Minerva-Author_HorizLogo_RGB.svg" />
          
## Minerva Repository Structure

### Minerva Story
The GitHub Pages site build is stored at [minerva-story](https://github.com/labsyspharm/minerva-story). The source code for the minified bundle is stored at [minerva-browser](https://github.com/labsyspharm/minerva-browser).

### Minerva Author
The Python Flask server along with automated testing is stored at [minerva-author](https://github.com/labsyspharm/minerva-author). The React UI is stored at [minerva-author-ui](https://github.com/labsyspharm/minerva-author-ui)

## Running the UI locally

### Local environment
Local environment requires that minerva-author backend is running on the same machine.
```
npm i && npm run start
```
### Cloud environment
Cloud environment uses only endpoints from Minerva Cloud (no local backend is needed).
```
npm i && npm run start:cloud
```

The server will be running on port `8487`.
