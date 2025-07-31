import React from "react";
import Slider from "react-slick";
import { motion } from "framer-motion";
import img1 from "../../../assets/images.jpeg";
import img2 from "../../../assets/images2.jpeg";

export default function Index() {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,            
    autoplaySpeed: 1000, 
  };

  return (
    <motion.div
      className="homebanner"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <Slider {...settings}>
        <div className="item1">
          <img src={img1} className="w-100" alt="Slide 1" />
        </div>
        <div className="item2">
          <img src={img2} className="w-100" alt="Slide 2" />
        </div>
      </Slider>
    </motion.div>
  );
}
