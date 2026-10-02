const express = require("express");
const mysql = require("mysql2/promise");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

function loadEnv() {
  const envPath = path.join(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;
  fs.readFileSync(envPath, "utf8").split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const idx = trimmed.indexOf("=");
    if (idx < 0) return;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (key) process.env[key] = value;
  });
}
loadEnv();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "community_volunteer",
  waitForConnections: true,
  connectionLimit: 10
});

const sessions = new Map();

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function token() {
  return crypto.randomBytes(24).toString("hex");
}

async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function one(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

function auth(req, res, next) {
  const bearer = req.headers.authorization || "";
  const key = bearer.startsWith("Bearer ") ? bearer.slice(7) : "";
  const user = sessions.get(key);
  if (!user) return res.status(401).json({ message: "Please log in again." });
  req.user = user;
  next();
}

function roleOnly(role) {
  return (req, res, next) => {
    if (req.user.role !== role) return res.status(403).json({ message: "This feature belongs to another user role." });
    next();
  };
}

async function createNotification(userId, title, message) {
  await query("INSERT INTO notifications (user_id,title,message) VALUES (?,?,?)", [userId, title, message]);
}

app.post("/api/register", async (req,res) => {

  try {

    const {
      name,
      email,
      password,
      role,
      phone,
      skills,
      availability,
      organizationType,
      otherOrganizationType,
      contactPerson,
      address,
      description
    } = req.body;


    if(!name || !email || !password || !role){

      return res.status(400).json({
        message:"Name, email, password and role are required."
      });

    }


    if(!["VOLUNTEER","ORGANIZATION"].includes(role)){

      return res.status(400).json({
        message:"Invalid role."
      });

    }


    /* =========================
       ORGANIZATION VALIDATION
    ========================= */

    if(role==="ORGANIZATION"){

      if(
        !organizationType ||
        !contactPerson ||
        !phone ||
        !address ||
        !description
      ){

        return res.status(400).json({
          message:"Please fill all required organization details."
        });

      }


      if(
        organizationType==="Other" &&
        !otherOrganizationType
      ){

        return res.status(400).json({
          message:"Please specify the organization type."
        });

      }

    }


    /* =========================
       CHECK EMAIL
    ========================= */

    const existing = await one(
      "SELECT id FROM users WHERE email=?",
      [email]
    );


    if(existing){

      return res.status(400).json({
        message:"An account with this email already exists."
      });

    }


    /* =========================
       PASSWORD HASH
    ========================= */

    const passwordHash = hashPassword(password);


    /* =========================
       ORGANIZATION TYPE
    ========================= */

    let finalOrganizationType = null;

    if(role==="ORGANIZATION"){

      finalOrganizationType =
        organizationType==="Other"
          ? otherOrganizationType
          : organizationType;

    }


    /* =========================
       INSERT
    ========================= */

    const result = await query(

      `INSERT INTO users
      (
        name,
        email,
        password_hash,
        role,
        phone,
        skills,
        availability,
        organization_type,
        contact_person,
        address,
        description
      )
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`,

      [

        name,
        email,
        passwordHash,
        role,

        phone || "",

        role==="VOLUNTEER"
          ? (skills || "")
          : "",

        role==="VOLUNTEER"
          ? (availability || "")
          : "",

        finalOrganizationType,

        role==="ORGANIZATION"
          ? contactPerson
          : null,

        role==="ORGANIZATION"
          ? address
          : null,

        role==="ORGANIZATION"
          ? description
          : null

      ]

    );


    res.json({

      message:
        role==="ORGANIZATION"
          ? "Organization account created successfully. You can now log in."
          : "Volunteer account created successfully. You can now log in.",

      id:result.insertId

    });


  }catch(e){

    console.error("REGISTER ERROR:",e);

    res.status(500).json({
      message:"Registration failed: " + e.message
    });

  }

});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const user = await one(
      "SELECT id,name,email,role,phone,skills,availability FROM users WHERE email=? AND password_hash=? AND role=?",
      [email, hashPassword(password || ""), role]
    );
    if (!user) return res.status(401).json({ message: "Invalid email, password, or role." });
    const t = token();
    sessions.set(t, user);
    res.json({ token: t, user });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Database connection failed. Check your .env and MySQL Server." });
  }
});

app.get("/api/me", auth, (req, res) => res.json(req.user));



// ================= ADMIN APIs =================

// Admin authentication middleware
// ================= ADMIN APIs =================

function adminOnly(req, res, next) {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({
      message: "Admin access only."
    });
  }
  next();
}


// Get all organizations
app.get("/api/admin/organizations", auth, adminOnly, async (req, res) => {
  try {
    const organizations = await query(`
      SELECT
        u.id,
        u.name,
        u.email,
        u.phone,
        COUNT(DISTINCT e.id) AS total_events,
        COUNT(DISTINCT CASE
          WHEN s.status IN ('APPROVED','COMPLETED')
          THEN s.volunteer_id
        END) AS total_volunteers
      FROM users u
      LEFT JOIN events e
        ON e.organization_id = u.id
      LEFT JOIN signups s
        ON s.event_id = e.id
      WHERE u.role = 'ORGANIZATION'
      GROUP BY u.id
      ORDER BY u.name
    `);

    res.json(organizations);

  } catch (e) {
    console.error(e);
    res.status(500).json({
      message: "Failed to load organizations."
    });
  }
});


// Get organization details + volunteers
app.get(
  "/api/admin/organizations/:id",
  auth,
  adminOnly,
  async (req, res) => {

    try {

      // =========================
      // ORGANIZATION DETAILS
      // =========================

      const organization = await one(`
        SELECT
          id,
          name,
          email,
          phone,
          organization_type,
          contact_person,
          address,
          description
        FROM users
        WHERE id = ?
          AND role = 'ORGANIZATION'
      `, [req.params.id]);


      if (!organization) {

        return res.status(404).json({
          message: "Organization not found."
        });

      }


      // =========================
      // VOLUNTEERS WHO
      // PARTICIPATED
      // =========================

      const volunteers = await query(`
        SELECT DISTINCT
          u.id,
          u.name,
          u.email,
          u.phone,
          u.skills,
          u.availability
        FROM users u

        JOIN signups s
          ON s.volunteer_id = u.id

        JOIN events e
          ON e.id = s.event_id

        WHERE e.organization_id = ?
          AND u.role = 'VOLUNTEER'

        ORDER BY u.name
      `, [req.params.id]);


      // =========================
      // TOTAL EVENTS
      // =========================

      const eventCount = await one(`
        SELECT COUNT(*) AS count
        FROM events
        WHERE organization_id = ?
      `, [req.params.id]);


      // =========================
      // AVAILABLE VOLUNTEERS
      // =========================

      const availableVolunteers = await query(`
        SELECT
          u.id,
          u.name,
          u.email,
          u.phone,
          u.skills,
          u.availability
        FROM users u

        WHERE u.role = 'VOLUNTEER'

          AND (
            u.availability IS NULL
            OR u.availability = ''
            OR LOWER(u.availability) LIKE '%available%'
            OR LOWER(u.availability) LIKE '%free%'
          )

        ORDER BY u.name
      `);


      // =========================
      // SEND RESPONSE
      // =========================

      res.json({

        organization: organization,

        total_events: eventCount.count,

        volunteers: volunteers,

        volunteer_count: volunteers.length,

        available_volunteers: availableVolunteers,

        available_count: availableVolunteers.length

      });


    } catch (e) {

      console.error(e);

      res.status(500).json({
        message: "Failed to load organization details."
      });

    }

  }
);

// ================= ALL VOLUNTEERS FOR ADMIN =================

app.get("/api/admin/volunteers", auth, adminOnly, async (req, res) => {
  try {

    const volunteers = await query(`
      SELECT
        u.id,
        u.name,
        u.email,
        u.phone,
        u.skills,
        u.availability,

        COUNT(DISTINCT CASE
          WHEN s.status IN ('APPROVED','COMPLETED')
          THEN s.event_id
        END) AS total_events,

        COUNT(DISTINCT CASE
          WHEN s.status IN ('APPROVED','COMPLETED')
          THEN s.id
        END) AS total_participations,

        COALESCE(SUM(a.hours), 0) AS total_hours,

        COUNT(DISTINCT CASE
          WHEN s.status = 'APPROVED'
          AND e.event_date >= CURDATE()
          THEN s.id
        END) AS upcoming_events

      FROM users u

      LEFT JOIN signups s
        ON s.volunteer_id = u.id

      LEFT JOIN events e
        ON e.id = s.event_id

      LEFT JOIN attendance a
        ON a.signup_id = s.id

      WHERE u.role = 'VOLUNTEER'

      GROUP BY
        u.id,
        u.name,
        u.email,
        u.phone,
        u.skills,
        u.availability

      ORDER BY u.name
    `);

    res.json(volunteers);

  } catch (e) {

    console.error(e);

    res.status(500).json({
      message: "Failed to load volunteers."
    });

  }
});

// ================= ADMIN VOLUNTEER DETAILS =================

app.get(
  "/api/admin/volunteers/:id",
  auth,
  adminOnly,
  async (req, res) => {

    try {

      const volunteerId = Number(req.params.id);

      // ---------------------------------
      // Volunteer profile
      // ---------------------------------

      const volunteer = await one(`
        SELECT
          id,
          name,
          email,
          phone,
          skills,
          availability
        FROM users
        WHERE id = ?
          AND role = 'VOLUNTEER'
      `, [volunteerId]);

      if (!volunteer) {
        return res.status(404).json({
          message: "Volunteer not found."
        });
      }


      // ---------------------------------
      // Participation / event records
      // ---------------------------------

      const participation = await query(`
        SELECT
          s.id AS signup_id,

          e.id AS event_id,
          e.title AS event_title,
          e.event_date,
          e.start_time,
          e.end_time,
          e.location,

          org.id AS organization_id,
          org.name AS organization_name,

          r.role_name,

          s.status,

          a.checkin_at,
          a.checkout_at,
          a.duration_minutes,
          a.hours,

          c.certificate_code

        FROM signups s

        JOIN events e
          ON e.id = s.event_id

        JOIN event_roles r
          ON r.id = s.role_id

        JOIN users org
          ON org.id = e.organization_id

        LEFT JOIN attendance a
          ON a.signup_id = s.id

        LEFT JOIN certificates c
          ON c.signup_id = s.id

        WHERE s.volunteer_id = ?

        ORDER BY e.event_date DESC
      `, [volunteerId]);


      // ---------------------------------
      // Recognition / rewards
      // ---------------------------------

      const rewards = await query(`
        SELECT
          r.id,
          r.title,
          r.details,
          r.awarded_at,
          org.name AS organization_name
        FROM rewards r

        JOIN users org
          ON org.id = r.organization_id

        WHERE r.volunteer_id = ?

        ORDER BY r.awarded_at DESC
      `, [volunteerId]);


      // ---------------------------------
      // Complaints
      // ---------------------------------

      const complaints = await query(`
        SELECT
          c.*,
          org.name AS organization_name
        FROM complaints c

        JOIN users org
          ON org.id = c.organization_id

        WHERE c.volunteer_id = ?

        ORDER BY c.created_at DESC
      `, [volunteerId]);


      // ---------------------------------
      // Misbehavior records
      // ---------------------------------

      const misbehavior = await query(`
        SELECT
          m.*,
          e.title AS event_title,
          org.name AS organization_name
        FROM misbehavior_records m

        JOIN users org
          ON org.id = m.organization_id

        LEFT JOIN events e
          ON e.id = m.event_id

        WHERE m.volunteer_id = ?

        ORDER BY m.created_at DESC
      `, [volunteerId]);


      // ---------------------------------
      // Summary
      // ---------------------------------

      const summary = await one(`
        SELECT

          COUNT(
            DISTINCT CASE
              WHEN s.status IN ('APPROVED','COMPLETED')
              THEN s.event_id
            END
          ) AS events_participated,

          COUNT(
            DISTINCT CASE
              WHEN s.status = 'COMPLETED'
              THEN s.id
            END
          ) AS events_completed,

          COALESCE(
            SUM(a.hours),
            0
          ) AS total_hours,

          COUNT(
            DISTINCT CASE
              WHEN c.id IS NOT NULL
              THEN c.id
            END
          ) AS certificates,

          COUNT(
            DISTINCT CASE
              WHEN s.status = 'PENDING'
              THEN s.id
            END
          ) AS pending_requests

        FROM users u

        LEFT JOIN signups s
          ON s.volunteer_id = u.id

        LEFT JOIN attendance a
          ON a.signup_id = s.id

        LEFT JOIN certificates c
          ON c.signup_id = s.id

        WHERE u.id = ?
          AND u.role = 'VOLUNTEER'
      `, [volunteerId]);


      // ---------------------------------
      // Send everything to Admin
      // ---------------------------------

      res.json({
        volunteer,
        summary,
        participation,
        rewards,
        complaints,
        misbehavior
      });

    } catch (e) {

      console.error("ADMIN VOLUNTEER DETAILS ERROR:", e);

      res.status(500).json({
        message: "Failed to load volunteer details."
      });

    }
  }
);

// Admin dashboard statistics
app.get("/api/admin/dashboard", auth, adminOnly, async (req, res) => {
  try {

    const organizations = await one(`
      SELECT COUNT(*) AS count
      FROM users
      WHERE role='ORGANIZATION'
    `);

    const volunteers = await one(`
      SELECT COUNT(*) AS count
      FROM users
      WHERE role='VOLUNTEER'
    `);

    // Volunteers who currently have approved/upcoming participation
    const assigned = await one(`
      SELECT COUNT(DISTINCT s.volunteer_id) AS count
      FROM signups s
      JOIN events e ON e.id=s.event_id
      WHERE s.status='APPROVED'
      AND e.event_date >= CURDATE()
    `);

    const totalHours = await one(`
      SELECT COALESCE(SUM(a.hours),0) AS hours
      FROM attendance a
    `);

    res.json({
      organizations: organizations.count,
      volunteers: volunteers.count,
      assignedVolunteers: assigned.count,
      freeVolunteers:
        Number(volunteers.count) - Number(assigned.count),
      totalHours: totalHours.hours
    });

  } catch (e) {

    console.error(e);

    res.status(500).json({
      message: e.message
    });
  }
});


// ================= ALL ORGANIZATIONS =================

app.get("/api/admin/organizations", auth, adminOnly, async (req, res) => {
  try {

    const organizations = await query(`
      SELECT
        u.id,
        u.name,
        u.email,
        u.phone,

        COUNT(DISTINCT e.id) AS events_created,

        COUNT(
          DISTINCT CASE
            WHEN s.status IN ('APPROVED','COMPLETED')
            THEN s.volunteer_id
          END
        ) AS volunteers_participated,

        COALESCE(
          SUM(a.hours),
          0
        ) AS total_hours

      FROM users u

      LEFT JOIN events e
        ON e.organization_id=u.id

      LEFT JOIN signups s
        ON s.event_id=e.id

      LEFT JOIN attendance a
        ON a.signup_id=s.id

      WHERE u.role='ORGANIZATION'

      GROUP BY
        u.id,
        u.name,
        u.email,
        u.phone

      ORDER BY u.name
    `);

    res.json(organizations);

  } catch (e) {

    console.error(e);

    res.status(500).json({
      message: e.message
    });
  }
});


// ================= ALL VOLUNTEERS =================

app.get("/api/admin/volunteers", auth, adminOnly, async (req, res) => {
  try {

    const volunteers = await query(`
      SELECT
        u.id,
        u.name,
        u.email,
        u.phone,
        u.skills,
        u.availability,

        COUNT(
          DISTINCT CASE
            WHEN s.status IN ('APPROVED','COMPLETED')
            THEN s.event_id
          END
        ) AS events_participated,

        COALESCE(
          SUM(a.hours),
          0
        ) AS total_hours,

        CASE

          WHEN EXISTS (
            SELECT 1
            FROM signups sx
            JOIN events ex
              ON ex.id=sx.event_id
            WHERE sx.volunteer_id=u.id
            AND sx.status='APPROVED'
            AND ex.event_date >= CURDATE()
          )

          THEN 'BUSY'

          ELSE 'AVAILABLE'

        END AS availability_status

      FROM users u

      LEFT JOIN signups s
        ON s.volunteer_id=u.id

      LEFT JOIN attendance a
        ON a.signup_id=s.id

      WHERE u.role='VOLUNTEER'

      GROUP BY
        u.id,
        u.name,
        u.email,
        u.phone,
        u.skills,
        u.availability

      ORDER BY u.name
    `);

    res.json(volunteers);

  } catch (e) {

    console.error(e);

    res.status(500).json({
      message: e.message
    });
  }
});

app.get("/api/events", auth, async (req, res) => {
  try {
    const events = await query(`
      SELECT e.*, u.name AS organization_name,
      (SELECT COUNT(*) FROM signups s WHERE s.event_id=e.id AND s.status IN ('APPROVED','COMPLETED')) AS approved_count
      FROM events e JOIN users u ON u.id=e.organization_id
      WHERE e.status='PUBLISHED' ORDER BY e.event_date, e.start_time
    `);
    for (const event of events) {
      event.roles = await query(`
        SELECT r.*, 
        (SELECT COUNT(*) FROM signups s WHERE s.role_id=r.id AND s.status IN ('APPROVED','COMPLETED')) AS filled
        FROM event_roles r WHERE r.event_id=? ORDER BY r.id
      `, [event.id]);
    }
    res.json(events);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get("/api/volunteer/dashboard", auth, roleOnly("VOLUNTEER"), async (req,res)=>{
  try {
    const totals = await one(`
      SELECT COUNT(DISTINCT s.event_id) events_completed, COALESCE(SUM(a.hours),0) total_hours
      FROM signups s LEFT JOIN attendance a ON a.signup_id=s.id
      WHERE s.volunteer_id=? AND s.status='COMPLETED'
    `,[req.user.id]);
    const pending = await one("SELECT COUNT(*) count FROM signups WHERE volunteer_id=? AND status='PENDING'",[req.user.id]);
    const upcoming = await query(`
      SELECT s.id signup_id,e.title,e.event_date,e.start_time,e.end_time,e.location,r.role_name,s.status,
      a.checkin_at,a.checkout_at,a.hours
      FROM signups s JOIN events e ON e.id=s.event_id JOIN event_roles r ON r.id=s.role_id
      LEFT JOIN attendance a ON a.signup_id=s.id
      WHERE s.volunteer_id=? ORDER BY e.event_date DESC LIMIT 8
    `,[req.user.id]);
    res.json({ totals, pending: pending.count, recent: upcoming });
  } catch(e){res.status(500).json({message:e.message});}
});

app.get("/api/volunteer/participation", auth, roleOnly("VOLUNTEER"), async (req, res) => {
  try {
    const rows = await query(`
      SELECT 
        s.id signup_id,
        e.title,
        e.event_date,
        e.start_time,
        e.end_time,
        e.location,
        r.role_name,
        s.status,
        a.checkin_at,
        a.checkout_at,
        a.hours,
        a.duration_minutes,
        c.certificate_code
      FROM signups s
      JOIN events e ON e.id=s.event_id
      JOIN event_roles r ON r.id=s.role_id
      LEFT JOIN attendance a ON a.signup_id=s.id
      LEFT JOIN certificates c ON c.signup_id=s.id
      WHERE s.volunteer_id=?
      ORDER BY e.event_date DESC
    `, [req.user.id]);

    res.json(rows);

  } catch (e) {
    console.error(e);

    res.status(500).json({
      message: "Failed to load participation."
    });
  }
});

app.get("/api/volunteer/notifications", auth, roleOnly("VOLUNTEER"), async(req,res)=>{
  res.json(await query("SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC",[req.user.id]));
});

app.patch("/api/volunteer/profile", auth, roleOnly("VOLUNTEER"), async(req,res)=>{
  const {name,phone,skills,availability}=req.body;
  await query("UPDATE users SET name=?,phone=?,skills=?,availability=? WHERE id=?",[name,phone,skills,availability,req.user.id]);
  const user=await one("SELECT id,name,email,role,phone,skills,availability FROM users WHERE id=?",[req.user.id]);
  sessions.forEach((u,k)=>{if(u.id===req.user.id)sessions.set(k,user);});
  res.json(user);
});

app.post("/api/events/:id/signup", auth, roleOnly("VOLUNTEER"), async(req,res)=>{
  try {
    const eventId=Number(req.params.id), roleId=Number(req.body.roleId);
    const role=await one("SELECT r.*,e.title,e.event_date FROM event_roles r JOIN events e ON e.id=r.event_id WHERE r.id=? AND r.event_id=?",[roleId,eventId]);
    if(!role) return res.status(404).json({message:"Role not found."});
    const existing=await one("SELECT id,status FROM signups WHERE event_id=? AND role_id=? AND volunteer_id=?",[eventId,roleId,req.user.id]);
    if(existing) return res.status(400).json({message:"You already applied for this role."});
    const filled=await one("SELECT COUNT(*) count FROM signups WHERE role_id=? AND status IN ('APPROVED','COMPLETED')",[roleId]);
    if(filled.count >= role.slots) return res.status(400).json({message:"This role is already full."});
    const result=await query("INSERT INTO signups(event_id,role_id,volunteer_id) VALUES(?,?,?)",[eventId,roleId,req.user.id]);
    await createNotification(req.user.id,"Signup submitted",`Your request for ${role.role_name} in ${role.title} is pending organization approval.`);
    res.json({message:"Signup submitted successfully.",id:result.insertId});
  } catch(e){res.status(500).json({message:e.message});}
});

app.post("/api/attendance/checkin", auth, roleOnly("VOLUNTEER"), async(req,res)=>{
  try {

    const signup = await one(`
      SELECT 
        s.*,
        e.title,
        e.event_date,
        e.start_time,
        e.end_time
      FROM signups s
      JOIN events e ON e.id=s.event_id
      WHERE s.id=?
        AND s.volunteer_id=?
        AND s.status='APPROVED'
    `,[req.body.signupId, req.user.id]);

    if(!signup){
      return res.status(400).json({
        message:"Only an approved signup can be checked in."
      });
    }

    const existing = await one(
      "SELECT * FROM attendance WHERE signup_id=?",
      [signup.id]
    );

    if(existing && existing.checkin_at){
      return res.status(400).json({
        message:"Already checked in."
      });
    }

    // Current date and time
    const now = new Date();

    // Event date + start/end time
    const start = new Date(
      `${signup.event_date}T${String(signup.start_time).slice(0,8)}`
    );

    const end = new Date(
      `${signup.event_date}T${String(signup.end_time).slice(0,8)}`
    );

    // Check-in only during event time
    if(now < start){
      return res.status(400).json({
        message:`Check-in will be available from ${String(signup.start_time).slice(0,5)}.`
      });
    }

    if(now > end){
      return res.status(400).json({
        message:"Check-in is closed because the event has ended."
      });
    }

    if(existing){
      await query(
        "UPDATE attendance SET checkin_at=NOW() WHERE signup_id=?",
        [signup.id]
      );
    }else{
      await query(
        "INSERT INTO attendance(signup_id,checkin_at,duration_minutes) VALUES(?,NOW(),0)",
        [signup.id]
      );
    }

    res.json({
      message:"Check-in recorded successfully."
    });

  }catch(e){

    console.error(e);

    res.status(500).json({
      message:"Check-in failed."
    });

  }
});

app.post("/api/attendance/checkout", auth, roleOnly("VOLUNTEER"), async(req,res)=>{
  try {

    const row = await one(`
      SELECT
        a.*,
        s.volunteer_id,
        s.id AS signup_id,
        e.title,
        e.event_date,
        e.start_time,
        e.end_time
      FROM attendance a
      JOIN signups s ON s.id=a.signup_id
      JOIN events e ON e.id=s.event_id
      WHERE a.signup_id=?
        AND s.volunteer_id=?
    `,[req.body.signupId,req.user.id]);

    if(!row || !row.checkin_at){
      return res.status(400).json({
        message:"Check in before checking out."
      });
    }

    if(row.checkout_at){
      return res.status(400).json({
        message:"Already checked out."
      });
    }

    const now = new Date();

    const start = new Date(
      `${row.event_date}T${String(row.start_time).slice(0,8)}`
    );

    const end = new Date(
      `${row.event_date}T${String(row.end_time).slice(0,8)}`
    );

    // Check-out cannot happen before event starts
    if(now < start){
      return res.status(400).json({
        message:"The event has not started yet."
      });
    }

    // Check-out cannot happen before check-in
    const checkinTime = new Date(row.checkin_at);

    if(now <= checkinTime){
      return res.status(400).json({
        message:"You must check in before checking out."
      });
    }

    /*
      Calculate actual minutes between
      check-in and check-out.
    */
    let minutes = Math.floor(
      (now.getTime() - checkinTime.getTime()) / 60000
    );

    /*
      Do not allow participation duration
      to exceed the event duration.
    */
    const eventMinutes = Math.floor(
      (end.getTime() - start.getTime()) / 60000
    );

    if(minutes > eventMinutes){
      minutes = eventMinutes;
    }

    await query(`
      UPDATE attendance
      SET
        checkout_at=NOW(),
        duration_minutes=?,
        hours=ROUND(?/60,2)
      WHERE signup_id=?
    `,[minutes,minutes,row.signup_id]);

    await query(
      "UPDATE signups SET status='COMPLETED' WHERE id=?",
      [row.signup_id]
    );

    res.json({
      message:"Check-out recorded. Participation duration updated.",
      duration_minutes:minutes
    });

  }catch(e){

    console.error(e);

    res.status(500).json({
      message:"Check-out failed."
    });

  }
});

app.get("/api/volunteer/certificates", auth, roleOnly("VOLUNTEER"), async(req,res)=>{
  res.json(await query(`
    SELECT c.*,e.title,e.event_date,r.role_name,a.hours
    FROM certificates c JOIN signups s ON s.id=c.signup_id JOIN events e ON e.id=s.event_id
    JOIN event_roles r ON r.id=s.role_id JOIN attendance a ON a.signup_id=s.id
    WHERE s.volunteer_id=? ORDER BY c.issued_at DESC
  `,[req.user.id]));
});

app.get("/api/org/dashboard", auth, roleOnly("ORGANIZATION"), async(req,res)=>{
  const org=req.user.id;
  const events=await one("SELECT COUNT(*) count FROM events WHERE organization_id=?",[org]);
  const published=await one("SELECT COUNT(*) count FROM events WHERE organization_id=? AND status='PUBLISHED'",[org]);
  const volunteers=await one(`
    SELECT COUNT(DISTINCT s.volunteer_id) count FROM signups s JOIN events e ON e.id=s.event_id
    WHERE e.organization_id=? AND s.status IN ('APPROVED','COMPLETED')
  `,[org]);
  const hours=await one(`
    SELECT COALESCE(SUM(a.hours),0) total FROM attendance a JOIN signups s ON s.id=a.signup_id
    JOIN events e ON e.id=s.event_id WHERE e.organization_id=?
  `,[org]);
  const pending=await one(`
    SELECT COUNT(*) count FROM signups s JOIN events e ON e.id=s.event_id
    WHERE e.organization_id=? AND s.status='PENDING'
  `,[org]);
  res.json({events:events.count,published:published.count,volunteers:volunteers.count,hours:hours.total,pending:pending.count});
});

app.get("/api/org/events", auth, roleOnly("ORGANIZATION"), async(req,res)=>{
  const events=await query("SELECT * FROM events WHERE organization_id=? ORDER BY event_date DESC",[req.user.id]);
  for(const e of events){
    e.roles=await query(`
      SELECT r.*, (SELECT COUNT(*) FROM signups s WHERE s.role_id=r.id AND s.status IN ('APPROVED','COMPLETED')) filled
      FROM event_roles r WHERE r.event_id=?
    `,[e.id]);
  }
  res.json(events);
});

app.post("/api/org/events", auth, roleOnly("ORGANIZATION"), async(req,res)=>{
  const {title,description,eventDate,startTime,endTime,location}=req.body;
  if(!title||!eventDate||!startTime||!endTime||!location) return res.status(400).json({message:"Fill all required event fields."});
  const r=await query("INSERT INTO events(organization_id,title,description,event_date,start_time,end_time,location,status) VALUES(?,?,?,?,?,?,?,'PUBLISHED')",[req.user.id,title,description,eventDate,startTime,endTime,location]);
  res.json({id:r.insertId,message:"Event created and published."});
});

app.post("/api/org/events/:id/roles", auth, roleOnly("ORGANIZATION"), async(req,res)=>{
  const event=await one("SELECT id FROM events WHERE id=? AND organization_id=?",[req.params.id,req.user.id]);
  if(!event)return res.status(404).json({message:"Event not found."});
  const {roleName,description,requiredSkills,slots}=req.body;
  if(!roleName||!slots||Number(slots)<1)return res.status(400).json({message:"Role name and positive slot count are required."});
  const r=await query("INSERT INTO event_roles(event_id,role_name,description,required_skills,slots) VALUES(?,?,?,?,?)",[req.params.id,roleName,description,requiredSkills,Number(slots)]);
  res.json({id:r.insertId,message:"Volunteer role added."});
});

app.get("/api/org/signups", auth, roleOnly("ORGANIZATION"), async(req,res)=>{
  res.json(await query(`
    SELECT s.id,e.title,e.event_date,r.role_name,r.slots,u.name volunteer_name,u.email,u.skills,u.availability,s.status,
    a.checkin_at,a.checkout_at,a.hours
    FROM signups s JOIN events e ON e.id=s.event_id JOIN event_roles r ON r.id=s.role_id JOIN users u ON u.id=s.volunteer_id
    LEFT JOIN attendance a ON a.signup_id=s.id
    WHERE e.organization_id=? ORDER BY s.requested_at DESC
  `,[req.user.id]));
});

app.patch("/api/org/signups/:id", auth, roleOnly("ORGANIZATION"), async(req,res)=>{
  const signup=await one(`
    SELECT s.*,e.title,r.role_name,r.slots,u.id volunteer_id FROM signups s
    JOIN events e ON e.id=s.event_id JOIN event_roles r ON r.id=s.role_id JOIN users u ON u.id=s.volunteer_id
    WHERE s.id=? AND e.organization_id=?
  `,[req.params.id,req.user.id]);
  if(!signup)return res.status(404).json({message:"Signup not found."});
  if(!["APPROVED","REJECTED"].includes(req.body.status))return res.status(400).json({message:"Invalid status."});
  if(req.body.status==="APPROVED"){
    const filled=await one("SELECT COUNT(*) count FROM signups WHERE role_id=? AND status IN ('APPROVED','COMPLETED')",[signup.role_id]);
    if(filled.count>=signup.slots)return res.status(400).json({message:"No slots remaining for this role."});
  }
  await query("UPDATE signups SET status=? WHERE id=?",[req.body.status,req.params.id]);
  await createNotification(signup.volunteer_id,`Signup ${req.body.status.toLowerCase()}`,`${signup.role_name} - ${signup.title} has been ${req.body.status.toLowerCase()} by the organization.`);
  res.json({message:`Signup ${req.body.status.toLowerCase()}.`});
});

app.get("/api/org/reports", auth, roleOnly("ORGANIZATION"), async(req,res)=>{
  const org=req.user.id;
  const totals=await one(`
    SELECT COUNT(DISTINCT e.id) events,COUNT(DISTINCT CASE WHEN s.status IN ('APPROVED','COMPLETED') THEN s.volunteer_id END) volunteers,
    COALESCE(SUM(a.hours),0) hours,COUNT(CASE WHEN s.status='COMPLETED' THEN 1 END) completed_signups
    FROM events e LEFT JOIN signups s ON s.event_id=e.id LEFT JOIN attendance a ON a.signup_id=s.id
    WHERE e.organization_id=?
  `,[org]);
  const turnout=await query(`
    SELECT e.title,e.event_date,
    COUNT(DISTINCT CASE WHEN s.status IN ('APPROVED','COMPLETED') THEN s.volunteer_id END) approved_volunteers,
    COALESCE(SUM(a.hours),0) hours
    FROM events e LEFT JOIN signups s ON s.event_id=e.id LEFT JOIN attendance a ON a.signup_id=s.id
    WHERE e.organization_id=? GROUP BY e.id ORDER BY e.event_date DESC
  `,[org]);
  res.json({totals,turnout});
});

app.get("/api/org/records", auth, roleOnly("ORGANIZATION"), async(req,res)=>{
  const org=req.user.id;
  const complaints=await query(`
    SELECT c.*,u.name volunteer_name FROM complaints c JOIN users u ON u.id=c.volunteer_id
    WHERE c.organization_id=? ORDER BY c.created_at DESC
  `,[org]);
  const rewards=await query(`
    SELECT r.*,u.name volunteer_name FROM rewards r JOIN users u ON u.id=r.volunteer_id
    WHERE r.organization_id=? ORDER BY r.awarded_at DESC
  `,[org]);
  const misbehavior=await query(`
    SELECT m.*,u.name volunteer_name,e.title event_title FROM misbehavior_records m
    JOIN users u ON u.id=m.volunteer_id LEFT JOIN events e ON e.id=m.event_id
    WHERE m.organization_id=? ORDER BY m.created_at DESC
  `,[org]);
  res.json({complaints,rewards,misbehavior});
});

app.delete("/api/org/events/:id", auth, roleOnly("ORGANIZATION"), async (req, res) => {
  const connection = await pool.getConnection();

  try {
    const eventId = Number(req.params.id);

    const event = await one(
      "SELECT id, title FROM events WHERE id=? AND organization_id=?",
      [eventId, req.user.id]
    );

    if (!event) {
      return res.status(404).json({
        message: "Event not found or you do not have permission to delete it."
      });
    }

    await connection.beginTransaction();

    // Get signup IDs first
    const [signups] = await connection.execute(
      "SELECT id FROM signups WHERE event_id=?",
      [eventId]
    );

    const signupIds = signups.map(s => s.id);

    if (signupIds.length > 0) {

      // Delete certificates
      await connection.execute(
        `DELETE FROM certificates
         WHERE signup_id IN (${signupIds.map(() => "?").join(",")})`,
        signupIds
      );

      // Delete attendance
      await connection.execute(
        `DELETE FROM attendance
         WHERE signup_id IN (${signupIds.map(() => "?").join(",")})`,
        signupIds
      );

      // Delete signups
      await connection.execute(
        "DELETE FROM signups WHERE event_id=?",
        [eventId]
      );
    }

    // Delete event roles
    await connection.execute(
      "DELETE FROM event_roles WHERE event_id=?",
      [eventId]
    );

    // Delete event
    await connection.execute(
      "DELETE FROM events WHERE id=? AND organization_id=?",
      [eventId, req.user.id]
    );

    await connection.commit();

    res.json({
      message: `"${event.title}" deleted successfully.`
    });

  } catch (e) {

    await connection.rollback();

    console.error("DELETE EVENT ERROR:", e);

    res.status(500).json({
      message: "Unable to delete event.",
      error: e.message
    });

  } finally {
    connection.release();
  }
});

app.post("/api/org/rewards", auth, roleOnly("ORGANIZATION"), async(req,res)=>{
  const {volunteerId,title,details}=req.body;
  await query("INSERT INTO rewards(volunteer_id,organization_id,title,details) VALUES(?,?,?,?)",[volunteerId,req.user.id,title,details]);
  await createNotification(volunteerId,"Recognition received",`You received a recognition: ${title}.`);
  res.json({message:"Recognition added."});
});

app.post("/api/org/misbehavior", auth, roleOnly("ORGANIZATION"), async(req,res)=>{
  const {volunteerId,eventId,details}=req.body;
  await query("INSERT INTO misbehavior_records(volunteer_id,organization_id,event_id,details) VALUES(?,?,?,?)",[volunteerId,req.user.id,eventId||null,details]);
  res.json({message:"Record added."});
});

app.post("/api/org/certificates/:signupId", auth, roleOnly("ORGANIZATION"), async(req,res)=>{
  const s=await one(`
    SELECT s.id,s.volunteer_id,s.status,a.hours FROM signups s JOIN events e ON e.id=s.event_id
    LEFT JOIN attendance a ON a.signup_id=s.id
    WHERE s.id=? AND e.organization_id=?
  `,[req.params.signupId,req.user.id]);
  if(!s)return res.status(404).json({message:"Participation record not found."});
  const bad=await one("SELECT id FROM misbehavior_records WHERE volunteer_id=? AND organization_id=?",[s.volunteer_id,req.user.id]);
  if(bad)return res.status(400).json({message:"Certificate blocked because a misbehavior record exists for this volunteer."});
  if(s.status!=="COMPLETED" || Number(s.hours||0)<=0)return res.status(400).json({message:"Volunteer must complete attendance before certificate generation."});
  const existing=await one("SELECT certificate_code FROM certificates WHERE signup_id=?",[s.id]);
  if(existing)return res.json({message:"Certificate already exists.",code:existing.certificate_code});
  const code="CEV-"+Date.now().toString(36).toUpperCase()+"-"+crypto.randomBytes(3).toString("hex").toUpperCase();
  await query("INSERT INTO certificates(signup_id,certificate_code) VALUES(?,?)",[s.id,code]);
  await createNotification(s.volunteer_id,"Certificate generated",`Your participation certificate is ready: ${code}`);
  res.json({message:"Certificate generated.",code});
});

app.post("/api/org/notify", auth, roleOnly("ORGANIZATION"), async(req,res)=>{
  const {eventId,title,message}=req.body;
  const rows=await query(`
    SELECT DISTINCT s.volunteer_id FROM signups s JOIN events e ON e.id=s.event_id
    WHERE e.id=? AND e.organization_id=? AND s.status IN ('APPROVED','COMPLETED')
  `,[eventId,req.user.id]);
  for(const r of rows) await createNotification(r.volunteer_id,title,message);
  res.json({message:`Notification sent to ${rows.length} volunteer(s).`});
});

app.get("/api/org/volunteers", auth, roleOnly("ORGANIZATION"), async(req,res)=>{
  res.json(await query(`
    SELECT u.id,u.name,u.email,u.phone,u.skills,u.availability,
    COUNT(DISTINCT s.event_id) events_participated,COALESCE(SUM(a.hours),0) total_hours
    FROM users u LEFT JOIN signups s ON s.volunteer_id=u.id AND s.status IN ('APPROVED','COMPLETED')
    LEFT JOIN attendance a ON a.signup_id=s.id
    WHERE u.role='VOLUNTEER' GROUP BY u.id ORDER BY u.name
  `));
});

app.use(express.static(path.join(__dirname, "..", "frontend")));
app.get("*", (req,res)=>res.sendFile(path.join(__dirname,"..","frontend","index.html")));

const PORT=Number(process.env.PORT||5000);
app.listen(PORT,()=>console.log(`Community Volunteer Platform running at http://localhost:${PORT}`));
