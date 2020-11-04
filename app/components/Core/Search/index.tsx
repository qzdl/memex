import React from 'react';
import { connect } from 'react-redux';
import elasticlunr from "elasticlunr";

let  ftindex =  elasticlunr(function() {
  this.setRef('_id');
  this.addField('title');
  this.addField('textContent');
  this.addField('excepts');
  this.addField('url');
  this.addField('siteName');

  this.saveDocuments = true; // for cached recall! woo
})

const mapStateToProps = (state) => ({
  layout: state.layout,
  search: state.search,
  query: state.query,
  results: state.results,
  ftindex: state.ftindex
});

const mapDispatchToProps = (dispatch) => {
  return {
    // dispatching plain actions
    handleClose: () =>
      dispatch({
        type: 'TOGGLE_DRAWER',
        payload: { visible: false, type: '', width: null },
      }),
    selectDoc: (payload) => dispatch({ type: 'SELECT_DOCUMENT', payload }),
    resetSelectedDoc: () => dispatch({ type: 'RESET_SELECTED_DOC' }),
  };
};


// TODO fuzzy search

class Search extends React.Component {
  state = {
    results: [],
    query: '',
    ftindex: ftindex
}

  componentDidMount() {
    console.log('search mount')
    this.getDocuments();
    console.log(this.state.docs)
  }

  async getDocuments() {
    const res = await fetch('http://localhost:3000/documents');
    const inboxItems = await res.json();
    console.log('getDocuments', inboxItems)
    const docs = inboxItems.rows.map(e => e.doc);
    docs && docs.map(e => this.state.ftindex.addDoc(e))
    this.setState({ docs });
  }

  getInfo = () => {
    let res = this.state.ftindex.documentStore && this.state.ftindex.search(this.state.query)
    console.log(res, this.state.query, this.state.docs, this.state.ftindex.documentStore)

    this.setState({
       results: res.map(({ ref, score }) =>
         {return { ref, score, doc: this.state.ftindex.documentStore.getDoc(ref) }})})
  }

  handleInputChange = () => {
    this.setState({
      query: this.search.value
    }, () => {
      if (this.state.query && this.state.query.length > 1) {

          this.getInfo()

      }

    })}


  results = () => {
    let binder = d => d.map(item => {
      item = item.doc || item
      return (

          <div className="card">
            <div className="card-body">
              <h5 className="card-title">{item.title}</h5>
              <p className="card-text">{item.textContent}</p>
              <p className="card-text">
                <small className="text-muted">
                  // TODO (now.epoch - updatedTime).asDuration
                  // TODO checkout date parsing and component output from inbox page
                  updated {item.updatedTime} ago
                </small>
              </p>
            </div>
          </div>
        )})

    if (this.state.results && this.state.results.length > 0)
      return <div className="card-group">{binder(this.state.results)}</div>
    else if (this.state.docs)
      return <div className="card-group"><h4>NO RESULTS</h4></div>
    else
      return <h2>no tux</h2>
  }

  render() {
    return (
      <div className="index">
        <div className="container">

            <div className="col-lg-12">
              <input
                placeholder="[search here...]"
                ref={input => this.search = input}
                onChange={this.handleInputChange} />


                {this.results()}


          </div>
        </div>
      </div>
    );
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(Search);
