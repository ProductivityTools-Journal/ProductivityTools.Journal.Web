import React, {Component} from 'react';
import './App.css';



const list=[
	{
		title:'React',
		author:'React author',
		objectId:1
	},
	{
		title:'Node',
		author:'Node author',
		objectId:2
	}
]

function App() {
  return (
    <div className="App">
	{list.map(function(item){
		return (
		<div>
			<span>{item.objectId} </span>
			<span>{item.title}</span>
			<Notes/>
		</div>
		);
	})}
	
    </div>
  );
}

class Notes extends Component{
	
	render(){
		return (
			<div>
				<p>Type before/after</p>
				<p><input type="text"></input></p>
			</div>
		)
	}
}

export default App;
