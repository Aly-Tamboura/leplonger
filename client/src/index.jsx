const axios = require('axios');
const seedWeatherData = require('../../server/db/sampledata/weather.js');
const seedDiveData = require('../../server/db/sampledata/divesites.js');
import React from 'react';
import ReactDOM from 'react-dom';
import Modal from 'react-modal';

import $ from 'jquery';
import _ from 'underscore';

import LandingInfoContainer from './components/LandingWeather/LandingInfoContainer.jsx';
import DiveSiteInfoContainer from './components/DiveSitePanel/DiveSiteInfoContainer.jsx';
import CommentContainer from './components/CommentPanel/CommentContainer.jsx'

import TopBar from './components/Menu/TopBar.jsx'
import Login from './components/Menu/Login.jsx';
import Signup from './components/Menu/Signup.jsx';
import NewDiveSite from './components/Menu/NewDiveSite.jsx';

import DiveMap from './components/Map/DiveMap.jsx';
import mapstyles from './components/Map/mapStyles.json';

import sampleDarkSky from '../../server/db/sampledata/weatherDarkCloud.js';


class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentsite: null,
      sites: [],
      user: null,
      diveview: false,
      openInfoWindow: false,
      dive_site: false,

      modalIsOpen: false,
      modalLogin: false,
      modalSignup: false,

      weatherdata: seedWeatherData,

      siteDescription: '',
      commentdata: [],
      homeWeather: null,
      waveHeight: [],
      graphHeight: 1,
      bouyId: '.....',

      darksky: sampleDarkSky
    }

    this.showConditions = this.showConditions.bind(this);
    this.toggleInfoWindow = this.toggleInfoWindow.bind(this);
    this.getDiveSiteInfo = this.getDiveSiteInfo.bind(this);
    this.LogOut = this.LogOut.bind(this);
  }

  logIn (user, pass) {
    let loginInfo = {
      "user": user,
      "pass": pass
    };

    axios.post('/users', loginInfo)
      .then( (response) => {
        if (response.data !== 'User does Not exist') {
          this.setState({
            user: response.data,
            dive_site: !this.state.dive_site
          })
        } else {
          throw response.data
        }
      })
      .catch( (err) => {
        console.log('Error adding user: ', err);
      })
  }

  LogOut () {
    this.setState({
      user: null,
      dive_site: false
    });
  }

  new_users (username, password, repeatedPassword, skill, age, email) {
    let signUpInfo = {
        "user": username,
        "pass": password,
        "repeatedPassword": repeatedPassword,
        "skill": skill,
        "age": age,
        "email": email
    };

    axios.post('/new_users', signUpInfo)
      .then( (response) => {
        console.log(response.data)
        this.setState({
          user: response.data,
          dive_site: !this.state.dive_site
        })
      })
      .catch( (err) => {
        console.log('Error adding new user');
      })
  }

  componentDidMount() {
    axios.get('/dives')
      .then( (response) => {
        this.setState({
          sites: response.data
        })
      })
      .catch( (err) => {
        console.log('Could not retrieve dive sites from DB: ', err);
      })

    axios.get('/weather/home')
      .then( (response) => {
        this.setState({
          darksky: response.data,
          // homeWeather: response.data
        })
      })
      .catch( (err) => {
        console.log('Could not retrieve landing page data ', err)
      })
  }

  getDiveSiteInfo(site) {
    axios.post('/weather', {location: site.position})
      .then( (response) => {
        this.setState({
          weatherdata: response.data
        })
      })
      .catch( (err) => {
      })

      this.setState({
        siteDescription: site,
        currentsite: site
      })

    axios.post('/comments',{diveSite_id : site.id})
      .then((response) => {
        this.setState({
          commentdata: response.data
        })

        if (response.data.length === 0) {
          this.setState({
            commentdata: [],
            handleQueryError: true
          })
        } else {
          this.setState({
            handleQueryError: false,
            commentdata: response.data
          })
        }

      })

    axios.post('/ocean', {location: site.position})
      .then( (result) => {
        let max = 0;
        result.data.heights.forEach( (value) => {
          if (value.y > max) {
            max = value.y;
          }
        });

        this.setState({
          waveHeight: [result.data.heights],
          bouyId: result.data.id,
          graphHeight: max
        })
      })
      .catch( (err) => {
        console.log('Error getting some sick visuals ', err);
      })
  }

  addNewDiveSite (name, longitude, latitude, rating, description) {
    let data = {
      name: name,
      longitude: longitude,
      latitude: latitude,
      rating: rating,
      description: description
    }

    axios.post('/new_sites', data)
     .then(result => {
      console.log('result', result)

     })
     .catch(err => {
      console.log('err', err)
     })
  }

  addNewDiveSiteComment (divesite_id, message ,user_id) {
     let date = new Date();
      date = date.getUTCFullYear() + '-' +
      ('00' + (date.getUTCMonth()+1)).slice(-2) + '-' +
      ('00' + date.getUTCDate()).slice(-2) + ' ' +
      ('00' + date.getUTCHours()).slice(-2) + ':' +
      ('00' + date.getUTCMinutes()).slice(-2) + ':' +
      ('00' + date.getUTCSeconds()).slice(-2);

      let data = {
        divesite_id: divesite_id,
        message: message,
        user_id: user_id,
        date_1: date,
        name: this.state.user.name,
        skill: this.state.user.skill
      };

      axios.post('/newcomment', data)
        .then( (response) => {
          console.log('new comment added: ', response.data);
          this.setState({
            commentdata: this.state.commentdata.concat(response.data)
          })
        })
        .catch( (err) => {
          console.log('Error posing dive site comment to DB');
        })
  }

  showConditions (bool) {
    this.setState({
      diveview: bool
    });
  }

  toggleInfoWindow() {
    this.setState({
      openInfoWindow: !this.state.openInfoWindow
    })
  }


  render() {
    return (
      <div className='container-fluid '>

        <div className='row app-container'>
          <div>
            <TopBar
            newDiveSite={this.addNewDiveSite.bind(this)}
            new_users={this.new_users.bind(this)}
            logIn={this.logIn.bind(this)}
            user={this.state.user}
            logout={this.LogOut.bind(this)}
            dive_sites={this.state.dive_site}
            />
          </div>
        </div>{/* end first row */}

        <div className='row'>
          {this.state.diveview ? <DiveSiteInfoContainer graphHeight={this.state.graphHeight}
                                                        bouy={this.state.bouyId}
                                                        data={this.state.waveHeight}
                                                        description={this.state.siteDescription}
                                                        weatherdata={this.state.weatherdata} />
                                : <LandingInfoContainer landingWeather={this.state.homeWeather}
                                                        darksky={this.state.darksky}/>}
          {/* transfer to map component */}
          <DiveMap
            styles={ mapstyles }
            containerElement={ <div className='map-container col-md-6'></div> }
            mapElement={ <div id="map" className='col-md-12 map-section'></div> }
            markers={this.state.sites}
            showConditions={this.showConditions.bind(this)}
            toggleInfoWindow={this.toggleInfoWindow}
            getWeather={this.getDiveSiteInfo.bind(this)}
          />

          <div className='col-md-3 reviews-section'>
            {this.state.diveview ? <CommentContainer user={this.state.user}
                                                     userPresent={this.state.user}
                                                     currentsite={this.state.currentsite}
                                                     comments={this.state.commentdata}
                                                     addNewComment={this.addNewDiveSiteComment.bind(this)}/>
                                                    : null}
          </div>

        </div>

      </div>
    )
  }
}

ReactDOM.render(<App />, document.getElementById('app'));
