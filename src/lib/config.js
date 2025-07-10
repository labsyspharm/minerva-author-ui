const toMainSettings = (
  ItemRegistry, testPyramids, hash
) => {
  const loader = {
    metadata: null, // TODO
    data: testPyramids[0].toReversed().map(
      ({width, height}) => ({
        labels: ["t","c","z","y","x"],
        shape: [
          1, Object.keys(testPyramids).length, 1, height, width
        ]
      })
    )
  }
  const n_levels = loader.data.length;
  const shape_labels = loader.data[0].labels;
  const shape_values = loader.data[0].shape;
  const imageShape = Object.fromEntries(
    shape_labels.map((k, i) => [k, shape_values[i]])
  );
  return (
    (hash, loader, groups) => {
      const { g } = hash;
      const group = groups.find(
        (group) => group.g === g
      );
      const channels = group?.channels || [];
      // Defaults
      if (!loader) return toDefaultSettings(3);
      const full_level = loader.data[0];
      if (!loader) return toDefaultSettings(3);
      const { labels, shape } = full_level;
      const c_idx = labels.indexOf("c");
      const { SourceChannels } = ItemRegistry; 
      const marker_names = SourceChannels.map(x => x.Properties.Name)
      // TODO Simplify mapping of channel names to indices!
      const selections = channels.map(channel => {
        const c = SourceChannels[
          marker_names.indexOf(channel.name)
        ].Properties.SourceIndex;
        return { z: 0, t: 0, c };
      }).filter(({ c }, i) => {
        if (c < 0) {
          console.error(`Missing channel "${channels[i].name}"`);
          return false
        }
        return true;
      });
      const hexToRGB = (hex) => {
        // Remove leading # if it exists
        hex = hex.replace("#", "");
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return [r, g, b];
      };
      const colors = channels.map((c, i) => {
        return c.color ? hexToRGB(c.color) : [0, 0, 0];
      });
      const contrastLimits = channels.map(c => {
        return c.contrast; 
      });
      const channelsVisible = channels.map((c, i) => true);

      const n_channels = shape[c_idx] || 0;
      const out = {
        selections,
        colors,
        contrastLimits,
        channelsVisible,
        viewState: {
          zoom: -n_levels,
          target: [imageShape.x / 2, imageShape.y / 2, 0]
        }
      };
      return out;
    }
  )(
    hash, loader,
    ItemRegistry.Groups.map((group, g) => {
      const { Name } = group.Properties;
      const {
        Colors, GroupChannels, SourceChannels
      } = ItemRegistry;
      const channels = GroupChannels.filter(
        group_channel => (
          group_channel.Associations.Group.UUID == group.UUID
        )
      ).map(group_channel => {
        const defaults = { Name: '' };
        const { R, G, B } = Colors.find(({ ID }) => {
          return ID === group_channel.Associations.Color.ID;
        })?.Properties || {};
        const color = (
          (1 << 24) + (R << 16) + (G << 8) + B
        ).toString(16).slice(1);
        const { LowerRange, UpperRange } = group_channel.Properties;
        const { SourceChannel } = group_channel.Associations;
        const { Name } = SourceChannels.find(source_channel => (
          source_channel.UUID == SourceChannel.UUID
        ))?.Properties || defaults;
        return { 
          color, name: Name, contrast: [
            LowerRange, UpperRange
          ]
        };
      });
      return { 
        State: group.State,
        g, name: Name, channels,
      };
    })
  );
}

export {
  toMainSettings
}
