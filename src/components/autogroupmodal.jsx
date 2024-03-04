import React from 'react';
import { Confirm } from 'semantic-ui-react';

export default class AutoGroupModal extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        let modalClass = "ui modal";
        if (this.props.active) {
            modalClass += " active";
        }
        const { original_groups } = this.props; 
        const n_groups = original_groups.length;
        const group_sizes = original_groups.map(group => {
          return group.channels.length;
        }).sort();
        const group_range = [
          group_sizes[0], group_sizes[group_sizes.length - 1]
        ];
        const n_channels = [
           group_range.join('-'), group_range[0] 
        ][+(new Set(group_range).size == 1)]
        const s = ['s',''][+(n_groups==1)]
        return <Confirm
          header='Auto-generate channel groups'
          cancelButton="Cancel"
          onCancel={this.props.onCancel}
          onConfirm={this.props.onConfirm}
          open={this.props.open}
          content={
            <div style={{padding:"2em"}}>
              <div className="content inverted">
                  <p>
                      This action will overwrite existing groups, and {n_groups} group{s} of {n_channels} channels will be added.
                  </p>
              </div>
            </div>
          }
        />
    }
}
