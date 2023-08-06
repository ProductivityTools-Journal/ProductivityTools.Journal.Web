import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import * as moment from "moment";
import * as apiService from "services/apiService";
import { auth, logout } from "../../Session/firebase";
import axios from "axios";
import { getStorage, ref, getDownloadURL } from "firebase/storage";

export default function Home() {
  const [date, setDate] = useState();
  const [userEmail, setUserEmail] = useState();
  const navigate = useNavigate();
  useEffect(() => {
    const fetchData = async () => {
      const data = await apiService.getDate();
      setDate(data);
    };
    fetchData();
  }, []);

  // const login = () => {
  // }

  useEffect(()=>{
    const fetchData = async () => {
      const data = await apiService.getUserEmail();
      setUserEmail(data);
    };
    fetchData();
  },[])

  const buttonLogout = () => {
    logout();
    navigate("/Login");
  };

  let mt = moment(date);
  let dtFormated = mt.format("YYYY.MM.DD hh:mm:ss");

  // const getPicture = () => {
  //   var x = auth?.currentUser?.accessToken;
  //   let x1 =
  //     "https://storage.googleapis.com/storage/v1/b/ptjournal_pwujczyk-gmail-com/o/journalId-1494-pageId-825-hiopopotam-022.png?alt=media&access_token=" +
  //     x;
  //   return x1;
  // };

  // const getPicture2 = () => {
  //   var x = auth?.currentUser?.accessToken;
  //   let x1 =
  //     "https://firebasestorage.googleapis.com/v0/b/ptjournal-b53b0.appspot.com/o/ocTFwme0AqYwxrJsyyNoHZZOsc83%2FjournalId-1494-pageId-825-Untitled-011.png?alt=media&access_token=" +
  //     x;
  //   return x1;
  // };
  // const storage = getStorage();
  // getDownloadURL(ref(storage, "hiopopotam.png"))
  //   .then((url) => {
  //     // `url` is the download URL for 'images/stars.jpg
  //     // Or inserted into an <img> element
  //     const img = document.getElementById("xx1");
  //     img.setAttribute("src", url);
  //   })
  //   .catch((error) => {
  //     // Handle any errors
  //     console.log("X3dkdXrf3dX");
  //     console.log(error);
  //   });

  // var x = auth?.currentUser?.uid;
  // var path = x + "/Untitled.png";
  // getDownloadURL(ref(storage, path))
  //   .then((url) => {
  //     // `url` is the download URL for 'images/stars.jpg
  //     // Or inserted into an <img> element
  //     const img = document.getElementById("xx2");
  //     img.setAttribute("src", url);
  //   })
  //   .catch((error) => {
  //     // Handle any errors
  //     console.log("X3dkdXrf3dX");
  //     console.log(error);
  //   });

  // const download1 = () => {
  //   let url = "https://storage.googleapis.com/storage/v1/b/ptjournaltest1/o/Untitled.png?alt=media";
  //   let token = "Bearer "+"ya29.a0AWY7CklOO41nU5AoVxAU3ypVkY4O_0tOEAiGwSRJRosJhJAB7yw_TEmiIcDjHSNxyKOVaRTcpQp73yFp-HYPyRLjTOgBEzxwmBqNkM3BZwjnvKGW5MaQvh3ocHWl3zKq0VhYwZcoMPDVcK18wEmki6WvkWNeaCgYKAQUSARESFQG1tDrphDRmP8LVZc4G_OpYJAdemA0163";
  //   const headers = { 'Authorization': token };
  //   console.log(token);
  //   debugger;
  //   fetch(url, { headers }).then((response) => {
  //     debugger;
  //     console.log(response);
  //   }).catch(error=>{
  //     debugger;
  //   });
  // };

  return (
    <div>
      <p>Welcome on home page of dProductivityTools.Journal3.6</p>
      {/* <img src="http://localhost:3000/Image?fsdaf=pfe.png"></img>
      {/* <img src="http://localhost:5002/api/Image/Get?filename=l5m45fd5f4r8dx.png"></img> */}
      {/* <img src="http://localhost:8080/?fileName=journalId-133-pageId-1273-PPO-054.png"></img>
      <img src="https://us-central1-ptjournal-b53b0.cloudfunctions.net/CloudBuildFunction/?fileName=journalId-133-pageId-1273-PPO-054.png"></img> */} */}

      
      <p>{date ? `Server responded with date ${dtFormated}` : "Server hasn't responded yet"}</p>
      <p>{auth?.currentUser?.displayName}</p>
      <p>{auth?.currentUser?.email} </p>
      <button onClick={buttonLogout}>logout</button>
      <p><span>UserEmial:{userEmail}</span></p>
      <Link to="/List">List</Link>

      {/* <img alt="pawel1" src="https://storage.cloud.google.com/ptjournal_pwujczyk-gmail-com/journalId-1494-pageId-825-hiopopotam-022.png"></img><br></br> */}
      {/* <img
        alt="pawel2"
        src="https://firebasestorage.googleapis.com/v0/b/ptjournal-b53b0.appspot.com/o/xxx%2Fhiopopotam.png?alt=media"
      ></img>
      <br></br>
      <img
        alt="pawel3"
        src="https://firebasestorage.googleapis.com/v0/b/ptjournal-b53b0.appspot.com/o/hiopopotam.png?alt=media"
      ></img>
      <br></br>
      <img
        alt="pawel5"
        src="https://firebasestorage.googleapis.com/v0/b/ptjournal-b53b0.appspot.com/o/ocTFwme0AqYwxrJsyyNoHZZOsc83%2FjournalId-1494-pageId-825-Untitled-011.png?alt=media"
      ></img>
      <br></br>
      <img
        alt="pawel6"
        src="https://firebasestorage.googleapis.com/v0/b/ptjournal-b53b0.appspot.com/o/user%2FocTFwme0AqYwxrJsyyNoHZZOsc83%2FjournalId-1494-pageId-825-hiopopotam-061.png?alt=media"
      ></img>
      <br></br>
      <img alt="pawel7" src={getPicture()}></img>
      <br></br>
      <img alt="pawel3" src={getPicture2()}></img>
      <br></br>
      <img alt="pawel31" src="https://storage.cloud.google.com/ptjournal_pwujczyk-gmail-com/journalId-1494-pageId-825-hiopopotam-022.png?alt=media"></img>
      <br></br> */}
    </div>
  );
}
