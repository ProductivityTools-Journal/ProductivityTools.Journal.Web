import React, { useEffect, useState } from "react";
import TextField from "@mui/material/TextField";
import clsx from "clsx";
import SlateEditor from "Components/SlateEditor";
import axios from "axios";

function Image() {
  const [src, setSrc] = useState();
  const [image, setImage] = useState();
  useEffect(() => {
    const fetchData = async () => {
      const url = "https://www.simplilearn.com/ice9/free_resources_article_thumb/what_is_image_Processing.jpg";
      const image = await axios(url, { responseType: "blob" });
      setImage(image);
      const srcForImage = URL.createObjectURL(image.data);
      console.log(image);
      console.log(srcForImage);
      console.log("XX3dX22Xd");
      setSrc(srcForImage);
      
      //document.write();
      // let reader = new FileReader();
      // reader.readAsDataURL(image.data);
      // document.write(reader);
       // request.responseType="document";
        
      var reader = new FileReader();
      reader.readAsDataURL(image.data);
      reader.onloadend = function () {
        var base64data = reader.result;
        console.log(base64data);
        document.responseType="document";
        document.write(base64data);
      };

      var x=new Response();
    };
    fetchData();
  }, []);

  return src;
}

export default Image;
