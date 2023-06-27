import React, { useEffect, useState } from 'react'
import TextField from '@mui/material/TextField';
import clsx from 'clsx';
import SlateEditor from 'Components/SlateEditor';
import axios from 'axios';


function  Image() {

    const [src, setSrc]=useState();
    const [image, setImage]=useState();
    useEffect(() => {
        const fetchData = async () => {
            const url="https://www.simplilearn.com/ice9/free_resources_article_thumb/what_is_image_Processing.jpg";
            const image = await axios(url, { responseType: "blob"}); 
            setImage(image);
            const srcForImage = URL.createObjectURL(image.data)
            console.log(image)
            console.log(srcForImage);
            console.log("XX3dX22Xd")
            setSrc(srcForImage)
        };
        fetchData();
      }, []);
    
    return image.data
}

export default Image;