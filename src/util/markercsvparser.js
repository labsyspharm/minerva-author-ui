class MarkerCsvParser {
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