import React, {Component} from 'react';

class NameForm extends Component {
	constructor(props) {
	  super(props);
	  this.state = {value: ''};
  
	  this.handleChange = this.handleChange.bind(this);
	  this.handleSubmit = this.handleSubmit.bind(this);
	}
  
	handleChange(event) {
	  this.setState({value: event.target.value});
	}
  
	handleSubmit(event) {
	  alert('Podano następujące imię: ' + this.state.value);
	  event.preventDefault();
	}
  
	render() {
	  return (
		<form onSubmit={this.handleSubmit}>
		  <label>
			Imię:
			<input type="text" value={this.state.value} onChange={this.handleChange} />
		  </label>
		  <input type="submit" value="Wyślij" />
		</form>
	  );
	}
  }

<<<<<<< HEAD
  export default NameForm
=======
  export default NameForm;
>>>>>>> 1a8ec8c0e1383948bc3793ae3b5e482bffca438f
