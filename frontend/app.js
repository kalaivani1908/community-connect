const {useState,useEffect} = React;
const h = React.createElement;

const COLORS = {brown:"#674F04", cream:"#F5F0E8", beige:"#D3BD9A", taupe:"#A28F70"};

function api(path, options={}) {
  const token=localStorage.getItem("cev_token");
  const headers={"Content-Type":"application/json",...(options.headers||{})};
  if(token) headers.Authorization="Bearer "+token;
  return fetch(path,{...options,headers}).then(async r=>{
    const data=await r.json().catch(()=>({}));
    if(!r.ok) throw new Error(data.message||"Request failed");
    return data;
  });
}
function fmtDate(d){

  if(!d) return "-";

  let date;

  // MySQL Date object
  if(d instanceof Date){

    date = d;

  }

  // String date
  else{

    const value = String(d);

    // YYYY-MM-DD
    if(/^\d{4}-\d{2}-\d{2}$/.test(value)){

      date = new Date(value + "T00:00:00");

    }

    // Full ISO date / datetime
    else{

      date = new Date(value);

    }

  }

  if(isNaN(date.getTime())){

    return "-";

  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day:"2-digit",
      month:"short",
      year:"numeric"
    }
  );
}
function fmtTime(t){return t ? String(t).slice(0,5) : "-";}
function Button({children,className="",...p}){return h("button",{className:"btn "+(className||"btn-primary-custom"),...p},children)}
function Alert({message,type="danger"}){return message?h("div",{className:`alert alert-${type} alert-custom mb-3`},message):null}
function Navbar({user,onLogout}){return h("nav",{className:"navbar navbar-dark navbar-custom px-3"},h("div",{className:"container-fluid"},
  h("span",{className:"navbar-brand brand"},"Community Connect"),
  h("div",{className:"d-flex align-items-center gap-3"},h("span",{className:"small"},`${user.name} · ${user.role==="ORGANIZATION"?"Organization":"Volunteer"}`),h(Button,{className:"btn btn-light btn-sm",onClick:onLogout},"Logout"))
));}

function Register({role,onBack}){

  const [form,setForm]=useState({
    name:"",
    email:"",
    password:"",
    phone:"",

    skills:"",
    availability:"",

    organizationType:"",
    otherOrganizationType:"",
    contactPerson:"",
    address:"",
    description:""
  });

  const [msg,setMsg]=useState("");
  const [loading,setLoading]=useState(false);

  function change(e){
    setForm({
      ...form,
      [e.target.name]:e.target.value
    });
  }

  async function submit(e){

    e.preventDefault();

    setMsg("");
    setLoading(true);

    try{

      const data=await api("/api/register",{
        method:"POST",
        body:JSON.stringify({
          ...form,
          role
        })
      });

      setMsg(
        data.message ||
        "Registration successful."
      );

      setTimeout(()=>{
        onBack();
      },1000);

    }catch(e){

      setMsg(e.message);

    }finally{

      setLoading(false);

    }
  }

  return h(
    "div",
    {className:"login-wrap"},

    h(
      "div",
      {className:"login-card"},

      h(
        "div",
        {className:"text-center mb-4"},

        h(
          "div",
          {
            className:
              "badge badge-soft rounded-pill px-3 py-2 mb-2"
          },
          role==="VOLUNTEER"
            ?"Volunteer registration"
            :"Organization registration"
        ),

        h(
          "h1",
          {className:"fw-bold mb-1"},
          "Create account"
        ),

        h(
          "p",
          {className:"small-muted"},
          role==="VOLUNTEER"
            ?"Enter your volunteer details."
            :"Enter your organization details."
        )

      ),

      h(
        Alert,
        {
          message:msg,
          type:
            msg.includes("successfully")
              ?"success"
              :"danger"
        }
      ),

      h(
        "form",
        {onSubmit:submit},

        /* =========================
           VOLUNTEER
        ========================= */

        role==="VOLUNTEER" &&

        h(
          React.Fragment,
          null,

          h(
            "label",
            {className:"form-label"},
            "Full Name"
          ),

          h(
            "input",
            {
              className:"form-control mb-3",
              name:"name",
              value:form.name,
              onChange:change,
              required:true
            }
          ),

          h(
            "label",
            {className:"form-label"},
            "Email"
          ),

          h(
            "input",
            {
              className:"form-control mb-3",
              type:"email",
              name:"email",
              value:form.email,
              onChange:change,
              required:true
            }
          ),

          h(
            "label",
            {className:"form-label"},
            "Password"
          ),

          h(
            "input",
            {
              className:"form-control mb-3",
              type:"password",
              name:"password",
              value:form.password,
              onChange:change,
              required:true
            }
          ),

          h(
            "label",
            {className:"form-label"},
            "Phone Number"
          ),

          h(
            "input",
            {
              className:"form-control mb-3",
              name:"phone",
              value:form.phone,
              onChange:change,
              required:true
            }
          ),

          h(
            "label",
            {className:"form-label"},
            "Skills"
          ),

          h(
            "input",
            {
              className:"form-control mb-3",
              name:"skills",
              placeholder:"Example: Teaching, Communication",
              value:form.skills,
              onChange:change
            }
          ),

          h(
            "label",
            {className:"form-label"},
            "Availability"
          ),

          h(
            "input",
            {
              className:"form-control mb-3",
              name:"availability",
              placeholder:"Example: Weekends",
              value:form.availability,
              onChange:change
            }
          )

        ),

        /* =========================
           ORGANIZATION
        ========================= */

        role==="ORGANIZATION" &&

        h(
          React.Fragment,
          null,

          h(
            "label",
            {className:"form-label"},
            "Organization Name"
          ),

          h(
            "input",
            {
              className:"form-control mb-3",
              name:"name",
              placeholder:"Example: Helping Hands Foundation",
              value:form.name,
              onChange:change,
              required:true
            }
          ),

          h(
            "label",
            {className:"form-label"},
            "Organization Type"
          ),

          h(
            "select",
            {
              className:"form-select mb-3",
              name:"organizationType",
              value:form.organizationType,
              onChange:change,
              required:true
            },

            h(
              "option",
              {value:""},
              "Select organization type"
            ),

            h(
              "option",
              {value:"NGO"},
              "NGO"
            ),

            h(
              "option",
              {value:"College"},
              "College / Educational Institution"
            ),

            h(
              "option",
              {value:"Company"},
              "Company"
            ),

            h(
              "option",
              {value:"Community Group"},
              "Community Group"
            ),

            h(
              "option",
              {value:"Other"},
              "Other"
            )

          ),

          form.organizationType==="Other" &&

          h(
            React.Fragment,
            null,

            h(
              "label",
              {className:"form-label"},
              "Specify Organization Type"
            ),

            h(
              "input",
              {
                className:"form-control mb-3",
                name:"otherOrganizationType",
                placeholder:"Enter organization type",
                value:form.otherOrganizationType,
                onChange:change,
                required:true
              }
            )

          ),

          h(
            "label",
            {className:"form-label"},
            "Organization Email"
          ),

          h(
            "input",
            {
              className:"form-control mb-3",
              type:"email",
              name:"email",
              placeholder:"organization@example.com",
              value:form.email,
              onChange:change,
              required:true
            }
          ),

          h(
            "label",
            {className:"form-label"},
            "Password"
          ),

          h(
            "input",
            {
              className:"form-control mb-3",
              type:"password",
              name:"password",
              value:form.password,
              onChange:change,
              required:true
            }
          ),

          h(
            "label",
            {className:"form-label"},
            "Contact Person Name"
          ),

          h(
            "input",
            {
              className:"form-control mb-3",
              name:"contactPerson",
              placeholder:"Person responsible for the organization",
              value:form.contactPerson,
              onChange:change,
              required:true
            }
          ),

          h(
            "label",
            {className:"form-label"},
            "Contact Number"
          ),

          h(
            "input",
            {
              className:"form-control mb-3",
              name:"phone",
              placeholder:"Organization contact number",
              value:form.phone,
              onChange:change,
              required:true
            }
          ),

          h(
            "label",
            {className:"form-label"},
            "Organization Address"
          ),

          h(
            "textarea",
            {
              className:"form-control mb-3",
              name:"address",
              rows:"3",
              placeholder:"Enter complete organization address",
              value:form.address,
              onChange:change,
              required:true
            }
          ),

          h(
            "label",
            {className:"form-label"},
            "About Organization"
          ),

          h(
            "textarea",
            {
              className:"form-control mb-3",
              name:"description",
              rows:"3",
              placeholder:"Briefly describe your organization",
              value:form.description,
              onChange:change,
              required:true
            }
          )

        ),

        h(
          Button,
          {
            type:"submit",
            className:
              "btn btn-primary-custom w-100 py-2",
            disabled:loading
          },

          loading
            ?"Creating account..."
            :"Create account"
        ),

        h(
          "div",
          {className:"text-center mt-3"},

          h(
            "button",
            {
              type:"button",
              className:"btn btn-link",
              onClick:onBack
            },
            "← Back to Sign in"
          )

        )

      )

    )

  );
}

function Login({onLogin}){

  const [role,setRole]=useState("VOLUNTEER");

  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");

  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);

  const [showRegister,setShowRegister]=useState(false);

  async function submit(e){

    e.preventDefault();

    setErr("");
    setLoading(true);

    try{

      const d=await api("/api/login",{
        method:"POST",
        body:JSON.stringify({
          email,
          password,
          role
        })
      });

      localStorage.setItem("cev_token",d.token);

      onLogin(d.user);

    }catch(x){

      setErr(x.message);

    }finally{

      setLoading(false);

    }
  }

  function selectRole(r){

    setRole(r);

    // Clear old login details
    setEmail("");
    setPassword("");

    setErr("");
  }

  // =========================
  // REGISTER PAGE
  // =========================

  if(showRegister){

    return h(
      Register,
      {
        role:role,
        onBack:()=>{
          setShowRegister(false);
          setErr("");
        }
      }
    );

  }

  return h(
    "div",
    {className:"login-wrap"},

    h(
      "div",
      {className:"login-card"},

      // =========================
      // HEADER
      // =========================

      h(
        "div",
        {className:"text-center mb-4"},

        h(
          "div",
          {
            className:
              "badge badge-soft rounded-pill px-3 py-2 mb-2"
          },
          "Community platform"
        ),

        h(
          "h1",
          {className:"fw-bold mb-1"},
          "Welcome back"
        ),

        h(
          "p",
          {className:"small-muted"},
          "Choose your workspace before signing in."
        )
      ),

      // =========================
      // ROLE SELECTION
      // =========================

      h(
        "div",
        {className:"role-choice mb-4"},

        // VOLUNTEER
        h(
          "button",
          {
            type:"button",

            className:
              role==="VOLUNTEER"
              ?"selected"
              :"",

            onClick:()=>{
              selectRole("VOLUNTEER");
            }
          },

          h(
            "div",
            {className:"fs-4"},
            "🙋"
          ),

          h(
            "strong",
            null,
            "Volunteer"
          ),

          h(
            "div",
            {className:"small"},
            "Join & track"
          )
        ),

        // ORGANIZATION
        h(
          "button",
          {
            type:"button",

            className:
              role==="ORGANIZATION"
              ?"selected"
              :"",

            onClick:()=>{
              selectRole("ORGANIZATION");
            }
          },

          h(
            "div",
            {className:"fs-4"},
            "🏢"
          ),

          h(
            "strong",
            null,
            "Organization"
          ),

          h(
            "div",
            {className:"small"},
            "Manage & report"
          )
        ),

        // ADMIN
        h(
          "button",
          {
            type:"button",

            className:
              role==="ADMIN"
              ?"selected"
              :"",

            onClick:()=>{
              selectRole("ADMIN");
            }
          },

          h(
            "div",
            {className:"fs-4"},
            "👑"
          ),

          h(
            "strong",
            null,
            "Admin"
          ),

          h(
            "div",
            {className:"small"},
            "View & monitor"
          )
        )
      ),

      // =========================
      // ERROR MESSAGE
      // =========================

      h(
        Alert,
        {
          message:err
        }
      ),

      // =========================
      // LOGIN FORM
      // =========================

      h(
        "form",
        {
          onSubmit:submit
        },

        // EMAIL

        h(
          "label",
          {
            className:"form-label"
          },
          "Email"
        ),

        h(
          "input",
          {
            className:"form-control mb-3",

            type:"email",

            placeholder:"Enter your email",

            value:email,

            onChange:e=>{
              setEmail(e.target.value);
            },

            required:true
          }
        ),

        // PASSWORD

        h(
          "label",
          {
            className:"form-label"
          },
          "Password"
        ),

        h(
          "input",
          {
            className:"form-control mb-3",

            type:"password",

            placeholder:"Enter your password",

            value:password,

            onChange:e=>{
              setPassword(e.target.value);
            },

            required:true
          }
        ),

        // LOGIN BUTTON

        h(
          Button,
          {
            type:"submit",

            className:
              "btn btn-primary-custom w-100 py-2",

            disabled:loading
          },

          loading
            ?"Signing in..."
            :`Sign in as ${
              role==="ADMIN"
                ?"Admin"
                :role==="ORGANIZATION"
                ?"Organization"
                :"Volunteer"
            }`
        ),

        // =========================
        // SIGN UP
        // Only Volunteer &
        // Organization
        // =========================

        role!=="ADMIN" &&

        h(
          "div",
          {
            className:
              "text-center mt-3"
          },

          h(
            "span",
            {
              className:"small-muted"
            },
            "New user? "
          ),

          h(
            "button",
            {
              type:"button",

              className:"btn btn-link p-0",

              onClick:()=>{
                setErr("");
                setShowRegister(true);
              }
            },
            "Create account"
          )
        )
      )
    )
  );
}

function VolunteerApp({user,onLogout}){
  const [page,setPage]=useState("dashboard"),[data,setData]=useState(null),[events,setEvents]=useState([]),[message,setMessage]=useState("");
  async function load(){try{
    if(page==="dashboard")setData(await api("/api/volunteer/dashboard"));
    if(page==="events")setEvents(await api("/api/events"));
  }catch(e){setMessage(e.message)}}
  useEffect(()=>{load()},[page]);
  function nav(p){setMessage("");setPage(p)}
  return h("div",{className:"app-shell"},h(Navbar,{user,onLogout}),
    h("div",{className:"container-fluid"},h("div",{className:"row"},
      h("aside",{className:"col-lg-2 sidebar"},
        h("div",{className:"fw-bold mb-3 text-uppercase small-muted"},"Volunteer workspace"),
        [["dashboard","Overview"],["events","Find Events"],["participation","My Participation"],["certificates","Certificates"],["notifications","Notifications"],["profile","My Profile"]].map(x=>h("button",{key:x[0],className:`btn side-btn ${page===x[0]?"active":""}`,onClick:()=>nav(x[0])},x[1]))
      ),
      h("main",{className:"col-lg-10 page"},h(Alert,{message}),page==="dashboard"?h(VolunteerDashboard,{data,onNavigate:nav}):
        page==="events"?h(VolunteerEvents,{events,onRefresh:load}):
        page==="participation"?h(Participation,{}):
        page==="certificates"?h(Certificates,{}):
        page==="notifications"?h(Notifications,{}):
        h(Profile,{user,onUserUpdate:()=>{}}))
    ))
  );
}
function VolunteerDashboard({data,onNavigate}){
  if(!data)return h("div",{className:"empty"},"Loading...");
  const stats=[
    ["Completed events",data.totals.events_completed,"📅"],
    ["Total hours",Number(data.totals.total_hours||0).toFixed(2),"⏱️"],
    ["Pending requests",data.pending,"⏳"]
  ];
  const recent=data.recent.length ? h("div",{className:"table-wrap"},
    h("table",{className:"table"},
      h("thead",null,h("tr",null,["Event","Role","Date","Status","Hours"].map(x=>h("th",{key:x},x)))),
      h("tbody",null,data.recent.map(r=>h("tr",{key:r.signup_id},
        h("td",null,r.title),h("td",null,r.role_name),h("td",null,fmtDate(r.event_date)),
        h("td",null,h("span",{className:"badge badge-soft"},r.status)),
        h("td",null,r.hours||"—")
      )))
    )
  ) : h("div",{className:"empty"},"No participation records yet.");
  return h(React.Fragment,null,
    h("div",{className:"hero"},
      h("div",{className:"hero-box"},
        h("span",{className:"badge badge-soft rounded-pill mb-3"},"Volunteer workspace"),
        h("h1",null,"Your community journey"),
        h("p",{className:"lead small-muted mb-0"},"Discover opportunities, build participation history, and keep every contribution in one place.")
      )
    ),
    h("div",{className:"row g-3 mb-4"},stats.map(s=>
      h("div",{className:"col-md-4",key:s[0]},
        h("div",{className:"stat-card"},
          h("div",{className:"fs-3"},s[2]),
          h("div",{className:"stat-number"},s[1]),
          h("div",{className:"small-muted"},s[0])
        )
      )
    )),
    h("div",{className:"card-soft p-4"},
      h("div",{className:"d-flex justify-content-between align-items-center mb-3"},
        h("h4",{className:"section-title mb-0"},"Recent participation"),
        h(Button,{className:"btn btn-outline-custom btn-sm",onClick:()=>onNavigate("events")},"Find more events")
      ),
      recent
    )
  );
}
function VolunteerEvents({events,onRefresh}){
  const [msg,setMsg]=useState("");

  async function signup(event,role){
    try{
      await api(`/api/events/${event.id}/signup`,{
        method:"POST",
        body:JSON.stringify({
          roleId:role.id
        })
      });

      setMsg("Signup submitted. Wait for organization approval.");
      onRefresh();

    }catch(e){
      setMsg(e.message);
    }
  }

  return h(
    React.Fragment,
    null,

    h(
      "div",
      {className:"mb-4"},

      h(
        "span",
        {className:"badge badge-soft rounded-pill"},
        "Volunteer opportunities"
      ),

      h(
        "h2",
        {className:"section-title mt-2"},
        "Find Events"
      ),

      h(
        "p",
        {className:"small-muted"},
        "Browse community events and choose a suitable volunteer role."
      )
    ),

    h(
      Alert,
      {
        message:msg,
        type:msg.includes("submitted")?"success":"danger"
      }
    ),

    events.length === 0

      ? h(
          "div",
          {className:"empty"},
          "No events are currently available."
        )

      : h(
          "div",
          {className:"row g-4"},

          events.map(event =>

            h(
              "div",
              {
                className:"col-xl-6",
                key:event.id
              },

              h(
                "div",
                {
                  className:"event-card p-4"
                },

                /* EVENT HEADER */

                h(
                  "div",
                  {
                    className:"d-flex justify-content-between gap-3"
                  },

                  h(
                    "div",
                    null,

                    h(
                      "h4",
                      {className:"fw-bold"},
                      event.title
                    ),

                    h(
                      "div",
                      {className:"small-muted"},
                      `${fmtDate(event.event_date)} · ${fmtTime(event.start_time)}–${fmtTime(event.end_time)} · ${event.location}`
                    )
                  ),

                  h(
                    "span",
                    {
                      className:"badge badge-soft align-self-start"
                    },
                    `${event.approved_count || 0} joined`
                  )
                ),

                /* DESCRIPTION */

                h(
                  "p",
                  {className:"mt-3"},
                  event.description || "No description available."
                ),

                /* ROLES */

                h(
                  "div",
                  {
                    className:"fw-bold mb-2"
                  },
                  "Available Roles"
                ),

                event.roles && event.roles.length > 0

                  ? event.roles.map(role =>

                      h(
                        "div",
                        {
                          className:"role-box mb-2",
                          key:role.id
                        },

                        h(
                          "div",
                          {
                            className:"d-flex justify-content-between align-items-center"
                          },

                          h(
                            "strong",
                            null,
                            role.role_name
                          ),

                          h(
                            "span",
                            {
                              className:"small-muted"
                            },
                            `${role.filled || 0}/${role.slots} filled`
                          )
                        ),

                        h(
                          "div",
                          {
                            className:"small-muted my-2"
                          },
                          role.description || "Volunteer role"
                        ),

                        role.required_skills &&

                        h(
                          "div",
                          {
                            className:"small-muted mb-2"
                          },
                          `Required skills: ${role.required_skills}`
                        ),

                        h(
                          Button,
                          {
                            className:"btn btn-primary-custom btn-sm",
                            disabled:(role.filled || 0) >= role.slots,
                            onClick:()=>signup(event,role)
                          },

                          (role.filled || 0) >= role.slots
                            ? "Full"
                            : "Request Role"
                        )
                      )
                    )

                  : h(
                      "div",
                      {
                        className:"empty p-3"
                      },
                      "No volunteer roles available for this event."
                    )
              )
            )
          )
        )
  );
}

function formatDuration(minutes){
  if(minutes === null || minutes === undefined || minutes === ""){
    return "—";
  }

  minutes = Number(minutes);

  if(minutes < 60){
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if(mins === 0){
    return `${hours} hr`;
  }

  return `${hours} hr ${mins} min`;
}

function Participation(){
  const [rows,setRows]=useState([]);
  const [msg,setMsg]=useState("");
  const [now,setNow]=useState(new Date());

  async function load(){
    try{
      setRows(await api("/api/volunteer/participation"));
    }catch(e){
      setMsg(e.message);
    }
  }

  useEffect(()=>{
    load();

    const timer=setInterval(()=>{
      setNow(new Date());
    },1000);

    return ()=>clearInterval(timer);
  },[]);

  async function act(id,type){
    try{
      await api(`/api/attendance/${type}`,{
        method:"POST",
        body:JSON.stringify({signupId:id})
      });

      setMsg(
        type==="checkin"
          ? "Checked in successfully."
          : "Checked out and participation duration updated."
      );

      load();

    }catch(e){
      setMsg(e.message);
    }
  }

  function getEventDateTime(date,time){
    if(!date || !time) return null;

    return new Date(
      `${date}T${String(time).slice(0,8)}`
    );
  }

  return h(
    React.Fragment,
    null,

    h(
      "h2",
      {className:"section-title"},
      "My Participation"
    ),

    h(
      "p",
      {className:"small-muted"},
      "Track approvals, check-in/check-out, participation duration, and completion status."
    ),

    h(
      Alert,
      {
        message:msg,
        type:
          msg.includes("successfully") ||
          msg.includes("updated")
            ?"success"
            :"danger"
      }
    ),

    h(
      "div",
      {className:"card-soft p-3 table-wrap"},

      h(
        "table",
        {className:"table"},

        h(
          "thead",
          null,

          h(
            "tr",
            null,

            [
              "Event",
              "Role",
              "Date",
              "Status",
              "Attendance",
              "Duration",
              "Action"
            ].map(x=>
              h("th",{key:x},x)
            )
          )
        ),

        h(
          "tbody",
          null,

          rows.map(r=>{

            const start=getEventDateTime(
              r.event_date,
              r.start_time
            );

            const end=getEventDateTime(
              r.event_date,
              r.end_time
            );

            const eventStarted=start ? now>=start : false;
            const eventEnded=end ? now>end : false;

            let action="—";

            /*
             * APPROVED + not checked in
             */
            if(
              r.status==="APPROVED" &&
              !r.checkin_at
            ){

              if(!eventStarted){

                action=h(
                  Button,
                  {
                    className:"btn btn-secondary btn-sm",
                    disabled:true
                  },
                  "Check in not started"
                );

              }else if(eventEnded){

                action=h(
                  Button,
                  {
                    className:"btn btn-secondary btn-sm",
                    disabled:true
                  },
                  "Event ended"
                );

              }else{

                action=h(
                  Button,
                  {
                    className:"btn btn-beige btn-sm",
                    onClick:()=>act(
                      r.signup_id,
                      "checkin"
                    )
                  },
                  "Check in"
                );

              }
            }

            /*
             * Checked in but not checked out
             */
            else if(
              r.checkin_at &&
              !r.checkout_at
            ){

              action=h(
                Button,
                {
                  className:"btn btn-primary-custom btn-sm",
                  onClick:()=>act(
                    r.signup_id,
                    "checkout"
                  )
                },
                "Check out"
              );
            }

            /*
             * Certificate
             */
            else if(r.certificate_code){

              action="Certificate ready";

            }

            return h(
              "tr",
              {key:r.signup_id},

              h(
                "td",
                null,
                r.title
              ),

              h(
                "td",
                null,
                r.role_name
              ),

              h(
                "td",
                null,
                fmtDate(r.event_date)
              ),

              h(
                "td",
                null,

                h(
                  "span",
                  {className:"badge badge-soft"},
                  r.status
                )
              ),

              h(
                "td",
                null,

                r.checkout_at
                  ?"Completed"
                  :r.checkin_at
                    ?"Checked in"
                    :"Not checked in"
              ),

              h(
                "td",
                null,

                formatDuration(
                  r.duration_minutes
                )
              ),

              h(
                "td",
                null,
                action
              )
            );
          })
        )
      )
    )
  );
}
function Certificates(){
  const [rows,setRows]=useState([]);
  useEffect(()=>{api("/api/volunteer/certificates").then(setRows)},[]);
  const content=rows.length ? rows.map(r=>
    h("div",{className:"col-md-6",key:r.id},
      h("div",{className:"certificate"},
        h("div",{className:"small-muted"},"CERTIFICATE OF PARTICIPATION"),
        h("h3",{className:"fw-bold my-3"},r.title),
        h("p",null,"This certificate recognizes the volunteer contribution recorded for this event."),
        h("strong",null,`${Number(r.hours).toFixed(2)} participation hours`),
        h("div",{className:"mt-3 small-muted"},`Code: ${r.certificate_code}`),
        h("div",{className:"mt-3 small-muted"},`Issued: ${new Date(r.issued_at).toLocaleDateString()}`)
      )
    )
  ) : h("div",{className:"col-12"},h("div",{className:"empty"},"No certificates have been issued yet."));
  return h(React.Fragment,null,
    h("h2",{className:"section-title"},"Certificates"),
    h("p",{className:"small-muted"},"Certificates are issued by the organization after completed participation and eligibility checks."),
    h("div",{className:"row g-4"},content)
  );
}
function Notifications(){
  const [rows,setRows]=useState([]);
  useEffect(()=>{api("/api/volunteer/notifications").then(setRows)},[]);
  return h(React.Fragment,null,
    h("h2",{className:"section-title"},"Notifications"),
    h("div",{className:"row g-3"},rows.map(n=>
      h("div",{className:"col-12",key:n.id},
        h("div",{className:"card-soft p-3"},
          h("div",{className:"d-flex justify-content-between"},
            h("strong",null,n.title),
            h("span",{className:"small-muted"},new Date(n.created_at).toLocaleString())
          ),
          h("div",{className:"mt-2"},n.message)
        )
      )
    ))
  );
}
function Profile({user}){
  const [form,setForm]=useState({name:user.name,phone:user.phone||"",skills:user.skills||"",availability:user.availability||""}),[msg,setMsg]=useState("");
  async function save(e){e.preventDefault();try{await api("/api/volunteer/profile",{method:"PATCH",body:JSON.stringify(form)});setMsg("Profile updated.");}catch(x){setMsg(x.message)}}
  return h(React.Fragment,null,h("h2",{className:"section-title"},"My Profile"),h("p",{className:"small-muted"},"Volunteer profile and availability details used for matching and coordination."),h(Alert,{message:msg,type:"success"}),h("div",{className:"card-soft p-4 col-lg-8"},h("form",{onSubmit:save},[
    ["name","Name"],["phone","Phone"],["skills","Skills"],["availability","Availability"]
  ].map(x=>h("div",{className:"mb-3",key:x[0]},h("label",{className:"form-label"},x[1]),h("input",{className:"form-control",value:form[x[0]],onChange:e=>setForm({...form,[x[0]]:e.target.value})}))),h("Button",{type:"submit"},"Save changes"))));
}

function OrgApp({user,onLogout}){
  const [page,setPage]=useState("dashboard"),[msg,setMsg]=useState("");
  return h("div",{className:"app-shell"},h(Navbar,{user,onLogout}),h("div",{className:"container-fluid"},h("div",{className:"row"},
    h("aside",{className:"col-lg-2 sidebar"},h("div",{className:"fw-bold mb-3 text-uppercase small-muted"},"Organization workspace"),
      [["dashboard","Overview"],["events","Event Management"],["approvals","Volunteer Requests"],["attendance","Attendance"],["reports","Impact Reports"],["records","Records & Recognition"],["volunteers","Volunteer Directory"]].map(x=>h("button",{key:x[0],className:`btn side-btn ${page===x[0]?"active":""}`,onClick:()=>{setMsg("");setPage(x[0])}},x[1]))
    ),
    h("main",{className:"col-lg-10 page"},h(Alert,{message:msg}),page==="dashboard"?h(OrgDashboard,{}):page==="events"?h(OrgEvents,{setMsg}):page==="approvals"?h(OrgApprovals,{setMsg}):page==="attendance"?h(OrgAttendance,{setMsg}):page==="reports"?h(OrgReports,{}):page==="records"?h(OrgRecords,{setMsg}):h(OrgVolunteers,{}))
  )));
}
function OrgDashboard(){
  const [d,setD]=useState(null);
  useEffect(()=>{api("/api/org/dashboard").then(setD)},[]);
  if(!d)return h("div",{className:"empty"},"Loading organization dashboard...");
  const stats=[
    ["Events created",d.events,"📌"],
    ["Published events",d.published,"📣"],
    ["Active volunteers",d.volunteers,"🙋"],
    ["Hours recorded",Number(d.hours||0).toFixed(2),"⏱️"],
    ["Pending requests",d.pending,"⏳"]
  ];
  return h(React.Fragment,null,
    h("div",{className:"hero"},
      h("div",{className:"hero-box"},
        h("span",{className:"badge badge-soft rounded-pill mb-3"},"Organization workspace"),
        h("h1",null,"Operations at a glance"),
        h("p",{className:"lead small-muted"},"Create opportunities, manage approvals, monitor turnout, and measure community impact.")
      )
    ),
    h("div",{className:"row g-3"},stats.map(x=>
      h("div",{className:"col-md-6 col-xl-3",key:x[0]},
        h("div",{className:"stat-card"},
          h("div",{className:"fs-3"},x[2]),
          h("div",{className:"stat-number"},x[1]),
          h("div",{className:"small-muted"},x[0])
        )
      )
    ))
  );
}
function OrgEvents({setMsg}){
  const [events,setEvents]=useState([]);
  const [show,setShow]=useState(false);

  const [form,setForm]=useState({
    title:"",
    description:"",
    eventDate:"",
    startTime:"09:00",
    endTime:"12:00",
    location:""
  });

  const [role,setRole]=useState({
    eventId:"",
    roleName:"",
    description:"",
    requiredSkills:"",
    slots:1
  });

  async function load(){
    try{
      setEvents(await api("/api/org/events"));
    }catch(e){
      setMsg(e.message);
    }
  }

  async function deleteEvent(eventId){
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this event?"
  );

  if(!confirmDelete) return;

  try{
    await api(`/api/org/events/${eventId}`,{
      method:"DELETE"
    });

    setMsg("Event deleted successfully.");
    load();

  }catch(e){
    setMsg(e.message);
  }
}

  useEffect(()=>{
    load();
  },[]);

  async function create(e){
    e.preventDefault();

    try{
      await api("/api/org/events",{
        method:"POST",
        body:JSON.stringify(form)
      });

      setMsg("Event created and published.");

      setForm({
        title:"",
        description:"",
        eventDate:"",
        startTime:"09:00",
        endTime:"12:00",
        location:""
      });

      setShow(false);
      load();

    }catch(x){
      setMsg(x.message);
    }
  }

  async function addRole(e){
  e.preventDefault();

  try{

    if(!role.eventId){
      setMsg("Please select an event.");
      return;
    }

    await api(`/api/org/events/${role.eventId}/roles`,{
      method:"POST",

      body:JSON.stringify({
        roleName:role.roleName,
        description:role.description,
        requiredSkills:role.requiredSkills,
        slots:Number(role.slots)
      })
    });

    setMsg("Volunteer role added successfully.");

    setRole({
      eventId:"",
      roleName:"",
      description:"",
      requiredSkills:"",
      slots:1
    });

    load();

  }catch(x){
    setMsg(x.message);
  }
}

  const eventCards=events.map(e=>{

    const roles=e.roles.map(r=>
      h(
        "div",
        {
          className:"role-box mb-2",
          key:r.id
        },

        h(
          "div",
          {
            className:"d-flex justify-content-between"
          },

          h(
            "strong",
            null,
            r.role_name
          ),

          h(
            "span",
            {
              className:"small-muted"
            },
            `${r.filled}/${r.slots} filled`
          )
        ),

        h(
          "div",
          {
            className:"small-muted"
          },
          r.required_skills || "No specific skill"
        )
      )
    );

    return h(
      "div",
      {
        className:"col-xl-6",
        key:e.id
      },

      h(
        "div",
        {
          className:"card-soft p-4"
        },

        h(
          "div",
          {
            className:"d-flex justify-content-between"
          },

          h(
            "h5",
            {
              className:"fw-bold"
            },
            e.title
          ),

          h(
  "div",
  {
    className:"d-flex align-items-center gap-2"
  },

  h(
    "span",
    {
      className:"badge badge-soft"
    },
    e.status
  ),

  h(
    Button,
    {
      className:"btn btn-outline-custom btn-sm",
      onClick:()=>deleteEvent(e.id)
    },
    "Delete"
  )
),
        ),

        h(
          "div",
          {
            className:"small-muted mb-3"
          },
          `${fmtDate(e.event_date)} · ${e.location}`
        ),

        h(
          "p",
          null,
          e.description
        ),

        h(
          "div",
          {
            className:"fw-bold mb-2"
          },
          "Role slots"
        ),

        roles
      )
    );
  });

  const fieldData=[
    ["title","Event title","text"],
    ["eventDate","Date","date"],
    ["startTime","Start time","time"],
    ["endTime","End time","time"],
    ["location","Location","text"]
  ];

  const createForm=
    h(
      "div",
      {
        className:"card-soft p-4 mb-4"
      },

      h(
        "h5",
        {
          className:"fw-bold"
        },
        "Create and publish event"
      ),

      h(
        "form",
        {
          onSubmit:create
        },

        h(
          "div",
          {
            className:"row g-3"
          },

          fieldData.map(x=>
            h(
              "div",
              {
                className:
                  x[0]==="title" ||
                  x[0]==="location"
                    ? "col-md-6"
                    : "col-md-3",
                key:x[0]
              },

              h(
                "label",
                {
                  className:"form-label"
                },
                x[1]
              ),

              h(
  "input",
  {
    className:"form-control",
    type:x[2],

    min:
      x[0]==="eventDate"
        ? new Date().toISOString().split("T")[0]
        : undefined,

    value:form[x[0]],

    onChange:e=>
      setForm({
        ...form,
        [x[0]]:e.target.value
      }),

    required:true
  }
)
            )
          ),

          h(
            "div",
            {
              className:"col-12"
            },

            h(
              "label",
              {
                className:"form-label"
              },
              "Description"
            ),

            h(
              "textarea",
              {
                className:"form-control",
                rows:3,
                value:form.description,
                onChange:e=>
                  setForm({
                    ...form,
                    description:e.target.value
                  })
              }
            )
          ),

          h(
            "div",
            {
              className:"col-12"
            },

            h(
              Button,
              {
                type:"submit"
              },
              "Publish event"
            )
          )
        )
      )
    );

  const addRoleForm=
    h(
      "div",
      {
        className:"card-soft p-4"
      },

      h(
        "h5",
        {
          className:"fw-bold"
        },
        "Add a role to an event"
      ),

      h(
        "form",
        {
          onSubmit:addRole
        },

        h(
          "div",
          {
            className:"row g-3"
          },

          /* EVENT SELECTION */
          h(
            "div",
            {
              className:"col-md-6"
            },

            h(
              "label",
              {
                className:"form-label"
              },
              "Select Event"
            ),

            h(
              "select",
              {
                className:"form-select",
                value:role.eventId,
                onChange:e=>{
  setRole({
    ...role,
    eventId:e.target.value
  });
},
                required:true
              },

              h(
                "option",
                {
                  value:""
                },
                "Select Event"
              ),

              events.map(e=>
                h(
                  "option",
                  {
                    key:e.id,
                    value:e.id
                  },
                  e.title
                )
              ),
            )
          ),

          /* ROLE NAME */
          h(
            "div",
            {
              className:"col-md-4"
            },

            h(
              "label",
              {
                className:"form-label"
              },
              "Role Name"
            ),

            h(
              "input",
              {
                className:"form-control",
                placeholder:"Example: Food Distribution Volunteer",
                value:role.roleName,
                onChange:e=>
                  setRole({
                    ...role,
                    roleName:e.target.value
                  }),
                required:true
              }
            )
          ),

          /* SLOTS */
          h(
            "div",
            {
              className:"col-md-2"
            },

            h(
              "label",
              {
                className:"form-label"
              },
              "Slots"
            ),

            h(
              "input",
              {
                className:"form-control",
                type:"number",
                min:"1",
                value:role.slots,
                onChange:e=>
                  setRole({
                    ...role,
                    slots:e.target.value
                  }),
                required:true
              }
            )
          ),

          /* REQUIRED SKILLS */
          h(
            "div",
            {
              className:"col-md-6"
            },

            h(
              "label",
              {
                className:"form-label"
              },
              "Required Skills"
            ),

            h(
              "input",
              {
                className:"form-control",
                placeholder:"Example: First Aid, Communication",
                value:role.requiredSkills,
                onChange:e=>
                  setRole({
                    ...role,
                    requiredSkills:e.target.value
                  })
              }
            )
          ),

          /* ROLE DESCRIPTION */
          h(
            "div",
            {
              className:"col-md-10"
            },

            h(
              "label",
              {
                className:"form-label"
              },
              "Role Description"
            ),

            h(
              "input",
              {
                className:"form-control",
                placeholder:"Describe the volunteer role",
                value:role.description,
                onChange:e=>
                  setRole({
                    ...role,
                    description:e.target.value
                  })
              }
            )
          ),

          /* ADD ROLE BUTTON */
          h(
            "div",
            {
              className:"col-md-2 d-flex align-items-end"
            },

            h(
              Button,
              {
                type:"submit",
                className:"w-100"
              },
              "Add Role"
            )
          )
        )
      )
    );

  return h(
    React.Fragment,
    null,

    h(
      "div",
      {
        className:"d-flex justify-content-between align-items-center mb-3"
      },

      h(
        "div",
        null,

        h(
          "h2",
          {
            className:"section-title mb-1"
          },
          "Event Management"
        ),

        h(
          "p",
          {
            className:"small-muted mb-0"
          },
          "Organization-only controls for events and role-based slots."
        )
      ),

      h(
        Button,
        {
          onClick:()=>setShow(!show)
        },
        show ? "Close" : "Create Event"
      )
    ),

    show ? createForm : null,

    addRoleForm,

    h(
      "div",
      {
        className:"row g-4 mt-2"
      },
      eventCards
    )
  );
}
function OrgApprovals({setMsg}){
  const [rows,setRows]=useState([]);
  async function load(){try{setRows(await api("/api/org/signups"))}catch(e){setMsg(e.message)}}
  useEffect(()=>{load()},[]);
  async function update(id,status){try{await api(`/api/org/signups/${id}`,{method:"PATCH",body:JSON.stringify({status})});setMsg(`Request ${status.toLowerCase()}.`);load()}catch(e){setMsg(e.message)}}
  const body=rows.map(r=>{
    const action=r.status==="PENDING"
      ? h("div",{className:"d-flex gap-1"},
          h(Button,{className:"btn btn-primary-custom btn-sm",onClick:()=>update(r.id,"APPROVED")},"Approve"),
          h(Button,{className:"btn btn-outline-custom btn-sm",onClick:()=>update(r.id,"REJECTED")},"Reject"))
      : "—";
    return h("tr",{key:r.id},
      h("td",null,h("strong",null,r.volunteer_name),h("div",{className:"small-muted"},r.email)),
      h("td",null,r.title),h("td",null,r.role_name),h("td",null,r.skills||"—"),
      h("td",null,r.availability||"—"),h("td",null,h("span",{className:"badge badge-soft"},r.status)),h("td",null,action)
    );
  });
  return h(React.Fragment,null,
    h("h2",{className:"section-title"},"Volunteer Requests"),
    h("p",{className:"small-muted"},"Approve or reject requests. Slot limits are checked again at approval time."),
    h("div",{className:"card-soft p-3 table-wrap"},
      h("table",{className:"table"},
        h("thead",null,h("tr",null,["Volunteer","Event","Role","Skills","Availability","Status","Action"].map(x=>h("th",{key:x},x)))),
        h("tbody",null,body)
      )
    )
  );
}
function OrgAttendance({setMsg}){
  const [rows,setRows]=useState([]);
  async function load(){try{setRows(await api("/api/org/signups"))}catch(e){setMsg(e.message)}}
  useEffect(()=>{load()},[]);
  async function cert(id){try{const d=await api(`/api/org/certificates/${id}`,{method:"POST"});setMsg(d.message+(d.code?` Code: ${d.code}`:""));load()}catch(e){setMsg(e.message)}}
  const body=rows.map(r=>h("tr",{key:r.id},
    h("td",null,r.volunteer_name),h("td",null,r.title),h("td",null,r.role_name),
    h("td",null,r.checkin_at?new Date(r.checkin_at).toLocaleString():"—"),
    h("td",null,r.checkout_at?new Date(r.checkout_at).toLocaleString():"—"),
    h("td",null,r.hours||"—"),h("td",null,r.status),
    h("td",null,r.status==="COMPLETED"?h(Button,{className:"btn btn-beige btn-sm",onClick:()=>cert(r.id)},"Generate"):"—")
  ));
  return h(React.Fragment,null,
    h("h2",{className:"section-title"},"Attendance & Completion"),
    h("p",{className:"small-muted"},"Review volunteer attendance and issue certificates only after completed participation and eligibility checks."),
    h("div",{className:"card-soft p-3 table-wrap"},
      h("table",{className:"table"},
        h("thead",null,h("tr",null,["Volunteer","Event","Role","Check-in","Check-out","Hours","Status","Certificate"].map(x=>h("th",{key:x},x)))),
        h("tbody",null,body)
      )
    )
  );
}
function OrgReports(){
  const [d,setD]=useState(null);
  useEffect(()=>{api("/api/org/reports").then(setD)},[]);
  if(!d)return h("div",{className:"empty"},"Loading reports...");
  const stats=[
    ["Events",d.totals.events],
    ["Volunteers",d.totals.volunteers],
    ["Hours",Number(d.totals.hours||0).toFixed(2)],
    ["Completed signups",d.totals.completed_signups]
  ];
  const body=d.turnout.map(r=>h("tr",{key:r.title+r.event_date},
    h("td",null,r.title),h("td",null,fmtDate(r.event_date)),
    h("td",null,r.approved_volunteers),h("td",null,Number(r.hours||0).toFixed(2))
  ));
  return h(React.Fragment,null,
    h("h2",{className:"section-title"},"Impact Reports"),
    h("p",{className:"small-muted"},"Organization-level participation trends, turnout, completed signups, and cumulative hours."),
    h("div",{className:"row g-3 mb-4"},stats.map(x=>
      h("div",{className:"col-md-3",key:x[0]},h("div",{className:"stat-card"},h("div",{className:"stat-number"},x[1]),h("div",{className:"small-muted"},x[0])))
    )),
    h("div",{className:"card-soft p-3 table-wrap"},
      h("table",{className:"table"},
        h("thead",null,h("tr",null,["Event","Date","Approved volunteers","Hours"].map(x=>h("th",{key:x},x)))),
        h("tbody",null,body)
      )
    )
  );
}
function OrgRecords({setMsg}){
  const [d,setD]=useState(null),[vols,setVols]=useState([]),[reward,setReward]=useState({volunteerId:"",title:"",details:""}),[bad,setBad]=useState({volunteerId:"",eventId:"",details:""});
  async function load(){setD(await api("/api/org/records"));setVols(await api("/api/org/volunteers"))}useEffect(()=>{load()},[]);
  if(!d)return h("div",{className:"empty"},"Loading records...");
  async function addReward(e){e.preventDefault();try{await api("/api/org/rewards",{method:"POST",body:JSON.stringify(reward)});setMsg("Recognition added.");setReward({volunteerId:"",title:"",details:""});load()}catch(x){setMsg(x.message)}}
  async function addBad(e){e.preventDefault();try{await api("/api/org/misbehavior",{method:"POST",body:JSON.stringify(bad)});setMsg("Misbehavior record added.");setBad({volunteerId:"",eventId:"",details:""});load()}catch(x){setMsg(x.message)}}
  return h(React.Fragment,null,h("h2",{className:"section-title"},"Records & Recognition"),h("div",{className:"row g-4 mb-4"},
    h("div",{className:"col-lg-6"},h("div",{className:"card-soft p-4"},h("h5",{className:"fw-bold"},"Add recognition"),h("form",{onSubmit:addReward},h("select",{className:"form-select mb-2",value:reward.volunteerId,onChange:e=>setReward({...reward,volunteerId:e.target.value}),required:true},h("option",{value:""},"Select volunteer"),vols.map(v=>h("option",{key:v.id,value:v.id},v.name))),h("input",{className:"form-control mb-2",placeholder:"Recognition title",value:reward.title,onChange:e=>setReward({...reward,title:e.target.value}),required:true}),h("input",{className:"form-control mb-2",placeholder:"Details",value:reward.details,onChange:e=>setReward({...reward,details:e.target.value})}),h(Button,{type:"submit"},"Add recognition")))),
    h("div",{className:"col-lg-6"},h("div",{className:"card-soft p-4"},h("h5",{className:"fw-bold"},"Record misbehavior"),h("form",{onSubmit:addBad},h("select",{className:"form-select mb-2",value:bad.volunteerId,onChange:e=>setBad({...bad,volunteerId:e.target.value}),required:true},h("option",{value:""},"Select volunteer"),vols.map(v=>h("option",{key:v.id,value:v.id},v.name))),h("input",{className:"form-control mb-2",placeholder:"Event ID (optional)",value:bad.eventId,onChange:e=>setBad({...bad,eventId:e.target.value})}),h("input",{className:"form-control mb-2",placeholder:"Details",value:bad.details,onChange:e=>setBad({...bad,details:e.target.value}),required:true}),h(Button,{type:"submit"},"Add record"))))
  ),h("div",{className:"row g-4"},h("div",{className:"col-lg-4"},h("div",{className:"card-soft p-3"},h("h5",null,"Recognition"),d.rewards.length?d.rewards.map(x=>h("div",{className:"role-box mb-2",key:x.id},h("strong",null,x.volunteer_name),h("div",null,x.title),h("div",{className:"small-muted"},x.details))):h("div",{className:"empty"},"No records."))),h("div",{className:"col-lg-4"},h("div",{className:"card-soft p-3"},h("h5",null,"Misbehavior"),d.misbehavior.length?d.misbehavior.map(x=>h("div",{className:"role-box mb-2",key:x.id},h("strong",null,x.volunteer_name),h("div",null,x.details),h("div",{className:"small-muted"},x.event_title||"General record"))):h("div",{className:"empty"},"No records."))),h("div",{className:"col-lg-4"},h("div",{className:"card-soft p-3"},h("h5",null,"Complaints"),d.complaints.length?d.complaints.map(x=>h("div",{className:"role-box mb-2",key:x.id},h("strong",null,x.volunteer_name),h("div",null,x.subject),h("div",{className:"small-muted"},x.status))):h("div",{className:"empty"},"No records."))))
  );
}
function OrgVolunteers(){
  const [rows,setRows]=useState([]);
  useEffect(()=>{api("/api/org/volunteers").then(setRows)},[]);
  const body=rows.map(v=>h("tr",{key:v.id},
    h("td",null,h("strong",null,v.name),h("div",{className:"small-muted"},v.email)),
    h("td",null,v.phone||"—"),h("td",null,v.skills||"—"),h("td",null,v.availability||"—"),
    h("td",null,v.events_participated),h("td",null,Number(v.total_hours||0).toFixed(2))
  ));
  return h(React.Fragment,null,
    h("h2",{className:"section-title"},"Volunteer Directory"),
    h("p",{className:"small-muted"},"Organization-only view of volunteer participation and availability."),
    h("div",{className:"card-soft p-3 table-wrap"},
      h("table",{className:"table"},
        h("thead",null,h("tr",null,["Volunteer","Contact","Skills","Availability","Events","Hours"].map(x=>h("th",{key:x},x)))),
        h("tbody",null,body)
      )
    )
  );
}

function AdminOrganizations({organizations,onSelect}){

  return h(
    React.Fragment,
    null,

    h(
      "h2",
      {className:"section-title"},
      "Organizations"
    ),

    h(
      "p",
      {className:"small-muted"},
      "View all registered organizations and their volunteer participation."
    ),

    h(
      "div",
      {className:"row g-4"},

      organizations.map(o=>

        h(
          "div",
          {className:"col-xl-6",key:o.id},

          h(
            "div",
            {className:"card-soft p-4"},

            h(
              "div",
              {
                className:
                "d-flex justify-content-between align-items-start"
              },

              h(
                "div",
                null,

                h(
                  "h4",
                  {className:"fw-bold mb-1"},
                  o.name
                ),

                h(
                  "div",
                  {className:"small-muted"},
                  o.email
                ),

                h(
                  "div",
                  {className:"small-muted"},
                  o.phone || "No phone"
                )
              ),

              h(
                "span",
                {className:"badge badge-soft"},
                "Organization"
              )
            ),

            h(
              "div",
              {className:"row g-2 mt-3"},

              h(
                "div",
                {className:"col-6"},

                h(
                  "div",
                  {className:"role-box"},

                  h(
                    "strong",
                    null,
                    o.total_events
                  ),

                  h(
                    "div",
                    {className:"small-muted"},
                    "Events"
                  )
                )
              ),

              h(
                "div",
                {className:"col-6"},

                h(
                  "div",
                  {className:"role-box"},

                  h(
                    "strong",
                    null,
                    o.total_volunteers
                  ),

                  h(
                    "div",
                    {className:"small-muted"},
                    "Volunteers"
                  )
                )
              )
            ),

            h(
              Button,
              {
                className:"btn btn-primary-custom btn-sm mt-3",
                onClick:()=>onSelect(o.id)
              },
              "View Organization"
            )
          )
        )
      )
    )
  );
}

function AdminOrganizationDetails({details,onBack}){

  if(!details){

    return h(
      "div",
      {className:"empty"},
      "Select an organization."
    );

  }

  const org=details.organization || {};

  return h(
    React.Fragment,
    null,

    /* BACK BUTTON */
    h(
      Button,
      {
        className:"btn btn-outline-custom btn-sm mb-3",
        onClick:onBack
      },
      "← Back to Organizations"
    ),


    /* =========================
       ORGANIZATION PROFILE
    ========================= */

    h(
      "div",
      {className:"card-soft p-4 mb-4"},

      h(
        "div",
        {className:"d-flex justify-content-between align-items-start"},

        h(
          "div",
          null,

          h(
            "span",
            {className:"badge badge-soft rounded-pill"},
            "Organization"
          ),

          h(
            "h2",
            {className:"section-title mt-2 mb-1"},
            org.name || "Organization"
          ),

          h(
            "div",
            {className:"small-muted"},
            org.email || "No email"
          ),

          h(
            "div",
            {className:"small-muted"},
            org.phone || "No phone number"
          )
        )
      ),


      /* =========================
         ORGANIZATION INFORMATION
      ========================= */

      h(
        "div",
        {className:"row g-3 mt-3"},

        h(
          "div",
          {className:"col-md-6"},

          h(
            "div",
            {className:"role-box"},

            h(
              "strong",
              null,
              "Organization Type"
            ),

            h(
              "div",
              {className:"mt-1"},
              org.organization_type ||
              "Not specified"
            )
          )
        ),


        h(
          "div",
          {className:"col-md-6"},

          h(
            "div",
            {className:"role-box"},

            h(
              "strong",
              null,
              "Contact Person"
            ),

            h(
              "div",
              {className:"mt-1"},
              org.contact_person ||
              "Not specified"
            )
          )
        ),


        h(
          "div",
          {className:"col-12"},

          h(
            "div",
            {className:"role-box"},

            h(
              "strong",
              null,
              "Address"
            ),

            h(
              "div",
              {className:"mt-1"},
              org.address ||
              "Address not provided"
            )
          )
        ),


        h(
          "div",
          {className:"col-12"},

          h(
            "div",
            {className:"role-box"},

            h(
              "strong",
              null,
              "About Organization"
            ),

            h(
              "div",
              {className:"mt-1"},
              org.description ||
              "No description provided."
            )
          )
        )
      )
    ),


    /* =========================
       STATISTICS
    ========================= */

    h(
      "div",
      {className:"row g-3 mb-4"},

      h(
        "div",
        {className:"col-md-4"},

        h(
          "div",
          {className:"stat-card"},

          h(
            "div",
            {className:"fs-3"},
            "📅"
          ),

          h(
            "div",
            {className:"stat-number"},
            details.total_events || 0
          ),

          h(
            "div",
            {className:"small-muted"},
            "Total Events"
          )
        )
      ),


      h(
        "div",
        {className:"col-md-4"},

        h(
          "div",
          {className:"stat-card"},

          h(
            "div",
            {className:"fs-3"},
            "🙋"
          ),

          h(
            "div",
            {className:"stat-number"},
            details.volunteer_count || 0
          ),

          h(
            "div",
            {className:"small-muted"},
            "Participating Volunteers"
          )
        )
      ),


      h(
        "div",
        {className:"col-md-4"},

        h(
          "div",
          {className:"stat-card"},

          h(
            "div",
            {className:"fs-3"},
            "🟢"
          ),

          h(
            "div",
            {className:"stat-number"},
            details.available_count || 0
          ),

          h(
            "div",
            {className:"small-muted"},
            "Available Volunteers"
          )
        )
      )
    ),


    /* =========================
       VOLUNTEERS
    ========================= */

    h(
      "div",
      {className:"card-soft p-4 mb-4"},

      h(
        "h4",
        {className:"section-title"},
        "Volunteers"
      ),

      h(
        "p",
        {className:"small-muted"},
        "Volunteers who have participated in this organization's events."
      ),

      !details.volunteers ||
      details.volunteers.length===0

      ?

      h(
        "div",
        {className:"empty"},
        "No volunteers have participated yet."
      )

      :

      h(
        "div",
        {className:"table-wrap"},

        h(
          "table",
          {className:"table"},

          h(
            "thead",
            null,

            h(
              "tr",
              null,

              [
                "Name",
                "Email",
                "Phone",
                "Skills",
                "Availability"
              ].map(x=>
                h(
                  "th",
                  {key:x},
                  x
                )
              )
            )
          ),

          h(
            "tbody",
            null,

            details.volunteers.map(v=>

              h(
                "tr",
                {key:v.id},

                h(
                  "td",
                  null,
                  h(
                    "strong",
                    null,
                    v.name
                  )
                ),

                h(
                  "td",
                  null,
                  v.email
                ),

                h(
                  "td",
                  null,
                  v.phone || "—"
                ),

                h(
                  "td",
                  null,
                  v.skills || "—"
                ),

                h(
                  "td",
                  null,

                  h(
                    "span",
                    {className:"badge badge-soft"},
                    v.availability ||
                    "Not specified"
                  )
                )
              )
            )
          )
        )
      )
    ),


    /* =========================
       AVAILABLE VOLUNTEERS
    ========================= */

    h(
      "div",
      {className:"card-soft p-4"},

      h(
        "h4",
        {className:"section-title"},
        "Currently Available Volunteers"
      ),

      h(
        "p",
        {className:"small-muted"},
        "Volunteers whose profile indicates that they are currently available."
      ),

      !details.available_volunteers ||
      details.available_volunteers.length===0

      ?

      h(
        "div",
        {className:"empty"},
        "No available volunteers found."
      )

      :

      h(
        "div",
        {className:"row g-3"},

        details.available_volunteers.map(v=>

          h(
            "div",
            {
              className:"col-md-6",
              key:v.id
            },

            h(
              "div",
              {className:"role-box"},

              h(
                "div",
                {
                  className:
                    "d-flex justify-content-between"
                },

                h(
                  "strong",
                  null,
                  v.name
                ),

                h(
                  "span",
                  {className:"badge badge-soft"},
                  "Available"
                )
              ),

              h(
                "div",
                {className:"small-muted mt-2"},
                v.email
              ),

              h(
                "div",
                {className:"small-muted"},
                v.phone || "No phone"
              ),
              
h(
  "div",
  {className:"small-muted"},
  "Type: ",
  org.organization_type || "Not specified"
),

h(
  "div",
  {className:"small-muted"},
  "Contact Person: ",
  org.contact_person || "Not specified"
),

h(
  "div",
  {className:"small-muted"},
  "Address: ",
  org.address || "Not specified"
),

h(
  "div",
  {className:"mt-3"},
  h(
    "strong",
    null,
    "About Organization"
  ),

  h(
    "p",
    {className:"mt-1 mb-0"},
    org.description || "No description provided."
  )
),

              h(
                "div",
                {className:"mt-2"},
                v.skills || "Skills not specified"
              )
            )
          )
        )
      )
    )
  );
}

function AdminVolunteers({ volunteers, onSelect }) {

  return h(
    React.Fragment,
    null,

    h(
      "h2",
      { className: "section-title" },
      "Volunteers"
    ),

    h(
      "p",
      { className: "small-muted" },
      "View all registered volunteers and their complete participation records."
    ),

    volunteers.length === 0

      ? h(
          "div",
          { className: "empty" },
          "No volunteers registered yet."
        )

      :

      h(
        "div",
        { className: "row g-4" },

        volunteers.map(v =>

          h(
            "div",
            {
              className: "col-xl-6",
              key: v.id
            },

            h(
              "div",
              { className: "card-soft p-4" },

              h(
                "div",
                {
                  className:
                    "d-flex justify-content-between align-items-start"
                },

                h(
                  "div",
                  null,

                  h(
                    "h4",
                    { className: "fw-bold mb-1" },
                    v.name
                  ),

                  h(
                    "div",
                    { className: "small-muted" },
                    v.email
                  ),

                  h(
                    "div",
                    { className: "small-muted" },
                    v.phone || "No phone number"
                  )
                ),

                h(
                  "span",
                  { className: "badge badge-soft" },
                  "Volunteer"
                )
              ),

              h(
                "div",
                { className: "mt-3" },

                h(
                  "div",
                  { className: "small-muted" },
                  "Skills"
                ),

                h(
                  "div",
                  null,
                  v.skills || "Skills not specified"
                )
              ),

              h(
                "div",
                { className: "mt-2" },

                h(
                  "div",
                  { className: "small-muted" },
                  "Availability"
                ),

                h(
                  "span",
                  { className: "badge badge-soft" },
                  v.availability_status || v.availability || "Available"
                )
              ),

              h(
                "div",
                { className: "row g-2 mt-3" },

                h(
                  "div",
                  { className: "col-4" },

                  h(
                    "div",
                    { className: "role-box" },

                    h(
                      "strong",
                      null,
                      v.events_participated || 0
                    ),

                    h(
                      "div",
                      { className: "small-muted" },
                      "Events"
                    )
                  )
                ),

                h(
                  "div",
                  { className: "col-4" },

                  h(
                    "div",
                    { className: "role-box" },

                    h(
                      "strong",
                      null,
                      Number(v.total_hours || 0).toFixed(2)
                    ),

                    h(
                      "div",
                      { className: "small-muted" },
                      "Hours"
                    )
                  )
                ),

                h(
                  "div",
                  { className: "col-4" },

                  h(
                    "div",
                    { className: "role-box" },

                    h(
                      "strong",
                      null,
                      v.total_participations || 0
                    ),

                    h(
                      "div",
                      { className: "small-muted" },
                      "Records"
                    )
                  )
                )
              ),

              h(
                Button,
                {
                  className:
                    "btn btn-primary-custom btn-sm mt-3",
                  onClick: () => onSelect(v.id)
                },
                "View Full Details"
              )
            )
          )
        )
      )
  );
}

function AdminVolunteerDetails({ details, onBack }) {

  /* =========================
     NO DETAILS
  ========================= */

  if (!details) {

    return h(
      "div",
      { className: "empty" },
      "Select a volunteer."
    );

  }


  /* =========================
     SAFE DATA
  ========================= */

  const v = details.volunteer || {};

  const s = details.summary || {};

  const participation =
    Array.isArray(details.participation)
      ? details.participation
      : [];

  const rewards =
    Array.isArray(details.rewards)
      ? details.rewards
      : [];

  const complaints =
    Array.isArray(details.complaints)
      ? details.complaints
      : [];

  const misbehavior =
    Array.isArray(details.misbehavior)
      ? details.misbehavior
      : [];


  /* =========================
     PAGE
  ========================= */

  return h(
    React.Fragment,
    null,


    /* =========================
       BACK BUTTON
    ========================= */

    h(
      Button,
      {
        className:
          "btn btn-outline-custom btn-sm mb-3",

        onClick: onBack
      },

      "← Back to Volunteers"
    ),


    /* =========================
       VOLUNTEER PROFILE
    ========================= */

    h(
      "div",
      {
        className:
          "card-soft p-4 mb-4"
      },


      h(
        "div",
        {
          className:
            "d-flex justify-content-between align-items-start"
        },


        h(
          "div",
          null,


          h(
            "span",
            {
              className:
                "badge badge-soft rounded-pill"
            },

            "Volunteer"
          ),


          h(
            "h2",
            {
              className:
                "section-title mt-2 mb-1"
            },

            v.name || "Volunteer"
          ),


          h(
            "div",
            {
              className:
                "small-muted"
            },

            v.email || "No email"
          ),


          h(
            "div",
            {
              className:
                "small-muted"
            },

            v.phone || "No phone number"
          )

        ),


        h(
          "span",
          {
            className:
              "badge badge-soft"
          },

          v.availability ||
          "Availability not specified"
        )

      ),


      h(
        "div",
        {
          className:
            "mt-3"
        },


        h(
          "strong",
          null,

          "Skills: "
        ),


        v.skills ||
        "Not specified"

      )

    ),


    /* =========================
       SUMMARY
    ========================= */

    h(
      "div",
      {
        className:
          "row g-3 mb-4"
      },


      /* EVENTS */

      h(
        "div",
        {
          className:
            "col-md-3"
        },

        h(
          "div",
          {
            className:
              "stat-card"
          },

          h(
            "div",
            {
              className:
                "fs-3"
            },

            "📅"
          ),

          h(
            "div",
            {
              className:
                "stat-number"
            },

            s.events_participated || 0
          ),

          h(
            "div",
            {
              className:
                "small-muted"
            },

            "Events Participated"
          )

        )

      ),


      /* COMPLETED */

      h(
        "div",
        {
          className:
            "col-md-3"
        },

        h(
          "div",
          {
            className:
              "stat-card"
          },

          h(
            "div",
            {
              className:
                "fs-3"
            },

            "✅"
          ),

          h(
            "div",
            {
              className:
                "stat-number"
            },

            s.events_completed || 0
          ),

          h(
            "div",
            {
              className:
                "small-muted"
            },

            "Completed"
          )

        )

      ),


      /* HOURS */

      h(
        "div",
        {
          className:
            "col-md-3"
        },

        h(
          "div",
          {
            className:
              "stat-card"
          },

          h(
            "div",
            {
              className:
                "fs-3"
            },

            "⏱️"
          ),

          h(
            "div",
            {
              className:
                "stat-number"
            },

            Number(
              s.total_hours || 0
            ).toFixed(2)
          ),

          h(
            "div",
            {
              className:
                "small-muted"
            },

            "Total Hours"
          )

        )

      ),


      /* CERTIFICATES */

      h(
        "div",
        {
          className:
            "col-md-3"
        },

        h(
          "div",
          {
            className:
              "stat-card"
          },

          h(
            "div",
            {
              className:
                "fs-3"
            },

            "🏆"
          ),

          h(
            "div",
            {
              className:
                "stat-number"
            },

            s.certificates || 0
          ),

          h(
            "div",
            {
              className:
                "small-muted"
            },

            "Certificates"
          )

        )

      )

    ),


    /* =========================
       PARTICIPATION RECORDS
    ========================= */

    h(
      "div",
      {
        className:
          "card-soft p-4 mb-4"
      },


      h(
        "h4",
        {
          className:
            "section-title"
        },

        "Participation Records"
      ),


      h(
        "p",
        {
          className:
            "small-muted"
        },

        "Complete event participation, attendance and certificate history."
      ),


      participation.length === 0

      ?


      h(
        "div",
        {
          className:
            "empty"
        },

        "No participation records found."
      )


      :


      h(
        "div",
        {
          className:
            "table-wrap"
        },


        h(
          "table",
          {
            className:
              "table"
          },


          h(
            "thead",
            null,

            h(
              "tr",
              null,

              [
                "Event",
                "Organization",
                "Role",
                "Date",
                "Status",
                "Check-in",
                "Check-out",
                "Duration",
                "Certificate"
              ].map(
                x =>
                  h(
                    "th",
                    {
                      key: x
                    },
                    x
                  )
              )

            )

          ),


          h(
            "tbody",
            null,


            participation.map(
              r =>

                h(
                  "tr",
                  {
                    key:
                      r.signup_id
                  },


                  h(
                    "td",
                    null,

                    h(
                      "strong",
                      null,

                      r.event_title ||
                      "—"
                    )

                  ),


                  h(
                    "td",
                    null,

                    r.organization_name ||
                    "—"
                  ),


                  h(
                    "td",
                    null,

                    r.role_name ||
                    "—"
                  ),


                  h(
                    "td",
                    null,

                    r.event_date
                      ? fmtDate(
                          r.event_date
                        )
                      : "—"
                  ),


                  h(
                    "td",
                    null,

                    h(
                      "span",
                      {
                        className:
                          "badge badge-soft"
                      },

                      r.status ||
                      "—"
                    )

                  ),


                  h(
                    "td",
                    null,

                    r.checkin_at ||
                    "—"
                  ),


                  h(
                    "td",
                    null,

                    r.checkout_at ||
                    "—"
                  ),


                  h(
                    "td",
                    null,

                    r.duration_minutes != null

                    ?

                    `${r.duration_minutes} min`

                    :

                    r.hours != null

                    ?

                    `${r.hours} hr`

                    :

                    "—"

                  ),


                  h(
                    "td",
                    null,

                    r.certificate_code

                    ?

                    h(
                      "span",
                      {
                        className:
                          "badge badge-soft"
                      },

                      "Issued"
                    )

                    :

                    "—"

                  )

                )

            )

          )

        )

      )

    ),


    /* =========================
       RECOGNITION & REWARDS
    ========================= */

    h(
      "div",
      {
        className:
          "card-soft p-4 mb-4"
      },


      h(
        "h4",
        {
          className:
            "section-title"
        },

        "Recognition & Rewards"
      ),


      rewards.length === 0

      ?


      h(
        "div",
        {
          className:
            "empty"
        },

        "No recognition records yet."
      )


      :


      h(
        "div",
        {
          className:
            "row g-3"
        },


        rewards.map(
          r =>

            h(
              "div",
              {
                className:
                  "col-md-6",

                key:
                  r.id
              },


              h(
                "div",
                {
                  className:
                    "role-box"
                },


                h(
                  "strong",
                  null,

                  r.title ||
                  "Recognition"
                ),


                h(
                  "div",
                  {
                    className:
                      "mt-1"
                  },

                  r.details ||
                  "No details"
                ),


                h(
                  "div",
                  {
                    className:
                      "small-muted mt-2"
                  },

                  r.organization_name ||
                  "Organization not specified"
                ),


                h(
                  "div",
                  {
                    className:
                      "small-muted"
                  },

                  r.awarded_at ||
                  ""
                )

              )

            )

        )

      )

    ),


    /* =========================
       COMPLAINTS
    ========================= */

    h(
      "div",
      {
        className:
          "card-soft p-4 mb-4"
      },


      h(
        "h4",
        {
          className:
            "section-title"
        },

        "Complaints"
      ),


      complaints.length === 0

      ?


      h(
        "div",
        {
          className:
            "empty"
        },

        "No complaints recorded."
      )


      :


      h(
        "div",
        {
          className:
            "row g-3"
        },


        complaints.map(
          c =>

            h(
              "div",
              {
                className:
                  "col-md-6",

                key:
                  c.id
              },


              h(
                "div",
                {
                  className:
                    "role-box"
                },


                h(
                  "strong",
                  null,

                  c.subject ||
                  "Complaint"
                ),


                h(
                  "div",
                  {
                    className:
                      "mt-1"
                  },

                  c.details ||
                  c.description ||
                  "No details"
                ),


                h(
                  "div",
                  {
                    className:
                      "small-muted mt-2"
                  },

                  `Organization: ${
                    c.organization_name ||
                    "Not specified"
                  }`
                ),


                h(
                  "span",
                  {
                    className:
                      "badge badge-soft mt-2"
                  },

                  c.status ||
                  "Recorded"
                )

              )

            )

        )

      )

    ),


    /* =========================
       MISBEHAVIOR RECORDS
    ========================= */

    h(
      "div",
      {
        className:
          "card-soft p-4 mb-4"
      },


      h(
        "h4",
        {
          className:
            "section-title"
        },

        "Misbehavior Records"
      ),


      misbehavior.length === 0

      ?


      h(
        "div",
        {
          className:
            "empty"
        },

        "No misbehavior records found."
      )


      :


      h(
        "div",
        {
          className:
            "row g-3"
        },


        misbehavior.map(
          m =>

            h(
              "div",
              {
                className:
                  "col-md-6",

                key:
                  m.id
              },


              h(
                "div",
                {
                  className:
                    "role-box"
                },


                h(
                  "strong",
                  null,

                  m.event_title ||
                  "General Record"
                ),


                h(
                  "div",
                  {
                    className:
                      "mt-1"
                  },

                  m.details ||
                  "No details"
                ),


                h(
                  "div",
                  {
                    className:
                      "small-muted mt-2"
                  },

                  `Organization: ${
                    m.organization_name ||
                    "Not specified"
                  }`
                ),


                h(
                  "div",
                  {
                    className:
                      "small-muted"
                  },

                  m.created_at ||
                  ""
                )

              )

            )

        )

      )

    )

  );

}

function AdminApp({user,onLogout}){

  const [page,setPage]=useState("dashboard");

  const [organizations,setOrganizations]=useState([]);
  const [selectedOrg,setSelectedOrg]=useState(null);
  const [details,setDetails]=useState(null);

  const [volunteers,setVolunteers]=useState([]);
  const [selectedVolunteer,setSelectedVolunteer]=useState(null);
  const [volunteerDetails,setVolunteerDetails]=useState(null);

  const [msg,setMsg]=useState("");


  /* =========================
     LOAD ORGANIZATIONS
  ========================= */

  async function loadOrganizations(){

    try{

      const data =
        await api("/api/admin/organizations");

      setOrganizations(data);

    }catch(e){

      setMsg(e.message);

    }

  }


  /* =========================
     LOAD ORGANIZATION DETAILS
  ========================= */

  async function loadOrganization(id){

    try{

      const data =
        await api(`/api/admin/organizations/${id}`);

      setDetails(data);
      setSelectedOrg(id);
      setPage("organization");

    }catch(e){

      setMsg(e.message);

    }

  }


  /* =========================
     LOAD VOLUNTEERS
  ========================= */

  async function loadVolunteers(){

    try{

      const data =
        await api("/api/admin/volunteers");

      setVolunteers(data);

    }catch(e){

      setMsg(e.message);

    }

  }


  /* =========================
     LOAD VOLUNTEER DETAILS
  ========================= */

  async function loadVolunteer(id){

    try{

      const data =
        await api(`/api/admin/volunteers/${id}`);

      setVolunteerDetails(data);
      setSelectedVolunteer(id);
      setPage("volunteer");

    }catch(e){

      setMsg(e.message);

    }

  }


  /* =========================
     INITIAL LOAD
  ========================= */

  useEffect(()=>{

    loadOrganizations();
    loadVolunteers();

  },[]);


  /* =========================
     NAVIGATION
  ========================= */

  function nav(p){

    setMsg("");
    setPage(p);

    if(p==="organizations"){
      loadOrganizations();
    }

    if(p==="volunteers"){
      loadVolunteers();
    }

  }


  return h(
    "div",
    {className:"app-shell"},


    /* =========================
       NAVBAR
    ========================= */

    h(
      Navbar,
      {
        user:user,
        onLogout:onLogout
      }
    ),


    h(
      "div",
      {className:"container-fluid"},


      h(
        "div",
        {className:"row"},


        /* =========================
           SIDEBAR
        ========================= */

        h(
          "aside",
          {className:"col-lg-2 sidebar"},


          h(
            "div",
            {
              className:
              "fw-bold mb-3 text-uppercase small-muted"
            },
            "Admin workspace"
          ),


          /* DASHBOARD */

          h(
            "button",
            {
              className:
              `btn side-btn ${
                page==="dashboard" ? "active" : ""
              }`,

              onClick:()=>nav("dashboard")
            },
            "Dashboard"
          ),


          /* ORGANIZATIONS */

          h(
            "button",
            {
              className:
              `btn side-btn ${
                page==="organizations" ||
                page==="organization"
                  ? "active"
                  : ""
              }`,

              onClick:()=>nav("organizations")
            },
            "Organizations"
          ),


          /* VOLUNTEERS */

          h(
            "button",
            {
              className:
              `btn side-btn ${
                page==="volunteers" ||
                page==="volunteer"
                  ? "active"
                  : ""
              }`,

              onClick:()=>nav("volunteers")
            },
            "Volunteers"
          )

        ),


        /* =========================
           MAIN CONTENT
        ========================= */

        h(
          "main",
          {className:"col-lg-10 page"},


          h(
            Alert,
            {
              message:msg
            }
          ),


          /* =========================
             DASHBOARD
          ========================= */

          page==="dashboard"

          ?

          h(
            AdminDashboard,
            {
              organizations:organizations,

              volunteers:volunteers,

              onViewOrganizations:
                ()=>nav("organizations"),

              onViewVolunteers:
                ()=>nav("volunteers")
            }
          )


          :


          /* =========================
             ORGANIZATION LIST
          ========================= */

          page==="organizations"

          ?

          h(
            AdminOrganizations,
            {
              organizations:organizations,

              onSelect:
                loadOrganization
            }
          )


          :


          /* =========================
             ORGANIZATION DETAILS
          ========================= */

          page==="organization"

          ?

          h(
            AdminOrganizationDetails,
            {
              details:details,

              onBack:
                ()=>nav("organizations")
            }
          )


          :


          /* =========================
             VOLUNTEER LIST
          ========================= */

          page==="volunteers"

          ?

          h(
            AdminVolunteers,
            {
              volunteers:volunteers,

              onSelect:
                loadVolunteer
            }
          )


          :


          /* =========================
             VOLUNTEER DETAILS
          ========================= */

          page==="volunteer"

          ?

          h(
            AdminVolunteerDetails,
            {
              details:volunteerDetails,

              onBack:
                ()=>nav("volunteers")
            }
          )


          :


          /* =========================
             DEFAULT
          ========================= */

          h(
            "div",
            {className:"empty"},
            "Select an option from the sidebar."
          )

        )

      )

    )

  );

}


function AdminDashboard({organizations,onViewOrganizations}){

  const totalOrganizations=organizations.length;

  const totalEvents=organizations.reduce(
    (sum,o)=>sum+Number(o.total_events||0),
    0
  );

  const totalVolunteers=organizations.reduce(
    (sum,o)=>sum+Number(o.total_volunteers||0),
    0
  );

  return h(
    React.Fragment,
    null,

    h(
      "div",
      {className:"hero"},

      h(
        "div",
        {className:"hero-box"},

        h(
          "span",
          {className:"badge badge-soft rounded-pill mb-3"},
          "Admin workspace"
        ),

        h(
          "h1",
          null,
          "Community Connect Administration"
        ),

        h(
          "p",
          {className:"lead small-muted"},
          "Monitor organizations, volunteers, events and community participation."
        )
      )
    ),

    h(
      "div",
      {className:"row g-3 mb-4"},

      h(
        "div",
        {className:"col-md-4"},

        h(
          "div",
          {className:"stat-card"},

          h("div",{className:"fs-3"},"🏢"),

          h(
            "div",
            {className:"stat-number"},
            totalOrganizations
          ),

          h(
            "div",
            {className:"small-muted"},
            "Organizations"
          )
        )
      ),

      h(
        "div",
        {className:"col-md-4"},

        h(
          "div",
          {className:"stat-card"},

          h("div",{className:"fs-3"},"📅"),

          h(
            "div",
            {className:"stat-number"},
            totalEvents
          ),

          h(
            "div",
            {className:"small-muted"},
            "Events"
          )
        )
      ),

      h(
        "div",
        {className:"col-md-4"},

        h(
          "div",
          {className:"stat-card"},

          h("div",{className:"fs-3"},"🙋"),

          h(
            "div",
            {className:"stat-number"},
            totalVolunteers
          ),

          h(
            "div",
            {className:"small-muted"},
            "Active Volunteers"
          )
        )
      )
    ),

    h(
      "div",
      {className:"card-soft p-4"},

      h(
        "div",
        {className:"d-flex justify-content-between align-items-center mb-3"},

        h(
          "h4",
          {className:"section-title mb-0"},
          "Organizations"
        ),

        h(
          Button,
          {
            className:"btn btn-outline-custom btn-sm",
            onClick:onViewOrganizations
          },
          "View All"
        )
      ),

      organizations.length===0

      ?

      h(
        "div",
        {className:"empty"},
        "No organizations found."
      )

      :

      h(
        "div",
        {className:"table-wrap"},

        h(
          "table",
          {className:"table"},

          h(
            "thead",
            null,

            h(
              "tr",
              null,

              ["Organization","Email","Events","Volunteers"].map(
                x=>h("th",{key:x},x)
              )

            )
          ),

          h(
            "tbody",
            null,

            organizations.slice(0,5).map(o=>

              h(
                "tr",
                {key:o.id},

                h("td",null,h("strong",null,o.name)),

                h("td",null,o.email),

                h("td",null,o.total_events),

                h("td",null,o.total_volunteers)

              )

            )
          )
        )
      )
    )
  );
}

function App(){
  const [user,setUser]=useState(null);
  useEffect(()=>{if(localStorage.getItem("cev_token"))api("/api/me").then(setUser).catch(()=>localStorage.removeItem("cev_token"))},[]);
  function logout(){localStorage.removeItem("cev_token");setUser(null)}
  if(!user)return h(Login,{onLogin:setUser});
  if(user.role==="ADMIN"){
  return h(AdminApp,{user,onLogout:logout});
}

if(user.role==="ORGANIZATION"){
  return h(OrgApp,{user,onLogout:logout});
}

return h(VolunteerApp,{user,onLogout:logout});
}
ReactDOM.createRoot(document.getElementById("root")).render(h(App));
