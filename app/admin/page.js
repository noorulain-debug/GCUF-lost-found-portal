import React from 'react'
import Navbar from '../components/Navebar/navbar'
import AdminDashboard from '../components/adminPage/admin'
import Footer from '../components/Footer/footer'

const ADMINPAGE = () => {
  return (
    <div>
      <Navbar></Navbar>
      <AdminDashboard></AdminDashboard>
      <Footer></Footer>
    </div>
  )
}

export default ADMINPAGE
