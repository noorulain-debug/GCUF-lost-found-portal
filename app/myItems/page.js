import React from 'react'
import MyItemsPage from '../components/My Items/myItems'
import Footer from '../components/Footer/footer'
import Navbar from '../components/Navebar/navbar'

const MYITEMS = () => {
  return (
    <div>
      <Navbar></Navbar>
      <MyItemsPage></MyItemsPage>
      <Footer></Footer>
    </div>
  )
}

export default MYITEMS
