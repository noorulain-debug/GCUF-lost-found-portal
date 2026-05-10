import React from 'react'
import Navbar from './components/Navebar/navbar'
import Home from './components/Home/home'
import Footer from './components/Footer/footer'
const mainPage = () => {
  return (
    <div>
      <Navbar></Navbar>
      <Home></Home>
      <Footer></Footer>
    </div>
  )
}

export default mainPage
