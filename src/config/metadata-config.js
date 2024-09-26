import foobarIpsum from 'foobar-ipsum'
import nanoid from '../lib/nanoid/nanoid'

class UUID {
  constructor() {
    this.nanoid = nanoid(21) 
    console.assert(!!this.nanoid, 'Used all test UUIDs')
  }
}

const lorem = new foobarIpsum({
  size: {
    sentence: 5, paragraph: 6
  }
})

const to_image = () => {
  // TODO
  return { UUID: new UUID().nanoid };
}

const to_channel = (image, data_type, index) => {
  return {
    UUID: new UUID().nanoid,
    Properties: {
      Name: lorem.sentence(1),
      LowerRange: 0, UpperRange: 65535
    },
    Associations: {
      SourceDataType: {
        UUID: data_type.UUID,
      },
      SourceImage: {
        UUID: image.UUID,
      },
      SourceIndex: index
    }
  }
}

const to_group = (expanded, channels=[]) => {
  return {
    UUID: new UUID().nanoid,
    Properties: {
      Name: lorem.sentence(1)
    },
    Associations: {
      Channels: channels.map((channel) => {
        return {
          ...channel,
          State: { Expanded: false }
        }
      })
    },
    State: {
      Expanded: expanded
    }
  }
}

const to_story = (expanded, length=1) => {
  return {
    UUID: new UUID().nanoid,
    Properties: {
      Name: lorem.sentence(3),
      Content: [...new Array(length)].map(() => {
        return lorem.paragraph()
      }).join('\n\n')
    },
    Associations: {
      Links: []
    },
    State: {
      Expanded: expanded
    }
  }
}

const to_metadata_config = () => {
  const image = to_image();
  const n_channels = 24;
  const data_type = {
    UUID: new UUID().nanoid,
    Properties: {
      LowerRange: 0,
      UpperRange: 65535
    }
  }
  const channels = [
    ...new Array(n_channels).keys()
  ].map(
    (_, i) => to_channel(image, data_type, i)
  );
  return {
    "Name": "Example Story",
    "Stories": [
      to_story(true, 1),
      to_story(false, 2),
      to_story(true, 3),
      to_story(false, 4)
    ],
    "Channels": channels,
    "Groups": [
      to_group(true, channels.slice(0,4)),
      to_group(true, channels.slice(4,8)),
      to_group(false, channels.slice(8,16)),
      to_group(false, channels.slice(16,24))
    ],
    "Images": [ image ],
    "DataTypes": [ data_type ]
  };
}

const metadata_config = to_metadata_config();

export { metadata_config }
