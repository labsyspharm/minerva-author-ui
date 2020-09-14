class MarkerCsvParser {

    readMarkerFile(file, onChannels, onError) {
        if (file.size > 100000) {
          onError('Csv file too large: ' + file.toString());
          return;
        }
    
        let reader = new FileReader();
        reader.onload = (event) => {
            try {
                let csvData = event.target.result; 
                let channelNames = this.parse(csvData);
                onChannels(channelNames);
            } catch (err) {
                onError(err);
            }
        };
        reader.readAsText(file);
      }

    parse(csv) {
        let channels = [];
        let rows = csv.split(/\r?\n/);
        for (let row of rows) {
            let cols = row.split(',');
            let markerName = cols[2];
            if (markerName.toLowerCase() === 'marker_name') {
                // Skip header row
                continue;
            }
            channels.push(cols[2]);
        }
        console.log(channels);
        return channels;
    }
}

export default MarkerCsvParser;