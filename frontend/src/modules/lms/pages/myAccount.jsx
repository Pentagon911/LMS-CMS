import image from '../../../assets/Linus-Torvalds-2012.webp'
export default function MyAccount(){
    const details = {
        "Name With Initials": "Torvalds L",
        "Username": "Penguin",
        "Birthday": "1969-12-28",
        "Primary Email": "LinusTorvalds123@gmail.com",
        "Gender": "Male"
    };

    const style1 = {
        height: 250,
        width: 175,
        borderRadius: 10,
        overflow: "hidden",
        margin: "5px 5px"
    };

    const style2 = {
        display: "flex",
        flexDirection: "row"  
    }
    return(
        <>
            <div className='forum'>
                <h1>My Informations</h1>
                <div style={style2}>
                    <div style={style1}><img src={image} alt="profile picture" style={{height:250, width:175}}/> </div>
                    <div className='forumText' >{Object.entries(details).map(([key,value]) => <p key={key}>{key}:{value}</p>)}</div>
                </div>
            </div>
            <form className='forum'>
                <h1>Edit My Informations</h1>
                <label for="fname" className='forumText'>First Name:</label>
                <input type="text" id="fname" name="fname"/><br/>
                
                <label for="lname" className='forumText'>Last Name:</label>
                <input type="text" id="lname" name="lname"/><br/>
                
                <label for="dob" className='forumText'>Date of Birth:</label>
                <input type="date" id="dob" name="dob"/><br/>
                
                <label className='forumText'>Gender:</label>
                <input type="radio" id="male" name="gender" value="Male"/>
                <label for="male" className='forumText'>Male</label>
                
                <input type="radio" id="female" name="gender" value="Female"/>
                <label for="female" className='forumText'>Female</label>
                
                <input type="radio" id="other" name="gender" value="Other"/>
                <label for="other" className='forumText'>Other</label><br/>
                
                <label for="address" className='forumText'>Address:</label><br/>
                <textarea id="address" name="address" rows="4" cols="30"></textarea><br/><br/>
                
                <button className='submitButton'>Submit</button>
            </form>
            <div className='forum'>
                <h1>Change Password</h1>
                <label for="oldPasswd" className='forumText'>Old Password:</label>
                <input type='password' id='oldPasswd' name='oldPasswd'/><br/>
                <label for="newPasswd" className='forumText'>New Password:</label>
                <input type='password' id='newPasswd' name='newPasswd'/><br/>
                <label for="confirmPasswd" className='forumText'>Confirm Password:</label>
                <input type='password' id='confirmPasswd' name='confirmPasswd'/><br/>
                <button className='submitButton'>Submit</button>
            </div>
        </>
    );
}
