import React from 'react';

import PopUp from './PopUp';
import RowsHandler from './Handlers/RowsHandler';
import CreationFormsHandler from './Handlers/CreationFormsHandler';

import Cookies from 'js-cookie';


export default class MainPage extends React.Component {
  constructor(props) {
    super(props);
    this.popUpRef = React.createRef();
    this.state = {
      url: props.url,
      mode: props.mode,
      showPopup: false,
      popupData: {},

      fetchedObjects: [],
      fieldNames: [],

      groupsIdToName: {},
    };
    this.tooglePopup = this.tooglePopup.bind(this);
    this.setData = this.setData.bind(this);
    this.getFieldNames = this.getFieldNames.bind(this);
    this.handleRequest = this.handleRequest.bind(this);
    this.updateFetchedObjects = this.updateFetchedObjects.bind(this);
  }


  async componentDidMount() {
    const url = this.props.url;
    const data = await this.handleRequest(url, 'GET');

    if (data.length > 0) {
      if (this.state.mode === 'users') {
        const groupArr = await this.handleRequest(this.props.grpUrl, 'GET');
        const groups = {};
        for (let group of groupArr) {
          groups[group.id] = group.name;
        };
        this.setState({
          groupsIdToName: groups
        });
      }
      const names = this.getFieldNames(data[0]);
      this.setState({
        fetchedObjects: data,
        fieldNames: names
      });
    }
  }


  async handleRequest(url, method, data) {
    if (['GET', 'DELETE'].includes(method)) {
      const res = await fetch(url, { method: method });
      const resData = await res.json();
      return resData;
    }

    else if (method === 'POST') {
      const csrftoken = Cookies.get('csrftoken');
      const request = {
        method: method,
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken
        }
      };
      const res = await fetch(url, request);
      const response = {
        status: res.status,
        message: res.message,
        data: await res.json()
      };
      return response;
    }
  };


  updateFetchedObjects(action, object) {
    const updatedArr = [...this.state.fetchedObjects];
    const search = (group) => group.id === object.id;
    const currentObjId = updatedArr.findIndex(search);

    if (action === 'add') {
      updatedArr.unshift(object);
    }

    else if (action === 'edit') {
      updatedArr[currentObjId] = object;
    }

    else if (action === 'delete') {
      updatedArr.splice(currentObjId, 1);
    };

    this.setState({
      fetchedObjects: updatedArr
    });
  }


  getFieldNames(object) {
    const names = [];
    for (let key of Object.keys(object)) {
      let name = key.charAt(0).toUpperCase() + key.slice(1);
      names.push(name);
    };
    return names;
  }

  setData(data) {
    this.setState({ popupData: data });
    this.tooglePopup();
  }

  tooglePopup() {
    this.setState(state => ({
      showPopup: !state.showPopup,
    }));
  }

  render() {
    return (
      <>
        <PopUp
          show={this.state.showPopup}
          tooglePopup={this.tooglePopup}
          ref={this.popUpRef} 
          data={this.state.popupData} />

        <CreationFormsHandler
          url={this.state.url}
          mode={this.state.mode}
          groupsIdToName={this.state.groupsIdToName}
          handleRequest={this.handleRequest}
          updateFetchedObjects={this.updateFetchedObjects} />

        <table className="table mt-4">
          <thead>
            <tr>
              {this.state.fieldNames.map(fieldName => (
                <th scope='col' key={fieldName}>{fieldName}</th>
              ))}
              <th scope='col'>Actions</th>
            </tr>
          </thead>
          <tbody>

            <RowsHandler
              url={this.state.url}
              mode={this.props.mode}
              objects={this.state.fetchedObjects}
              groupsIdToName={this.state.groupsIdToName}
              tooglePopup={this.tooglePopup}
              setData={this.setData}
              handleRequest={this.handleRequest}
              updateFetchedObjects={this.updateFetchedObjects} />

          </tbody>
        </table>
      </>
    )
  }
}