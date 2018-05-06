function Player ()
{
	this.sprite_scale = 0.05;
	this.sprite_turn_threshold = 7.5;

	this.step = 0;
	this.jumpCharge = 0;
	this.motor_speed = 100.0;
	this.debug = true;
	this.lean_torque = 1000.0;
}

Player.prototype.create = function ( group, x, y )
{
	// tunables
	var bodyFD = {};
	bodyFD.density = 1.0;
	bodyFD.friction = 0.1;

	var wheelFD = {};
	wheelFD.density = 10.0;
	wheelFD.friction = 0.9;

	this.jump_speed_max = 10000;
	this.jump_charge_time = 1000; // time in ms it takes to fully charge jump
	this.jump_start_time = undefined;
	this.jump_normal = false; // enable me to jump perpendicularly to the ground, sonic-style

	var joint = {};
	joint.motorSpeed = 0.0;
	joint.maxMotorTorque = 15000.0;
	joint.enableMotor = true;
	joint.frequencyHz = 4;
	joint.dampingRatio = 0.7;

	var xy_vector = planck.Vec2(x, y);
	var wheelBack_offset = planck.Vec2(-7, 0);
	var wheelFront_offset = planck.Vec2(7, 0);

	this.body_radius = 6;
	this.wheel_radius = 1.4;
	// this.bodyVertices = [
	// 	Vec2(-10, 1),
	// 	Vec2(-10, -1),
	// 	Vec2(10, -1),
	// 	Vec2(10, 1),
	// ];

	// create body
	this.body = Global.physics.createDynamicBody(Vec2(0.0, 8));
	this.body.createFixture(planck.Circle(this.body_radius), bodyFD);
	// this.body.createFixture(planck.Polygon(this.bodyVertices), bodyFD);

	// create wheels
	this.wheelBack = Global.physics.createDynamicBody(wheelBack_offset);
	this.wheelBack.createFixture(planck.Circle(this.wheel_radius), wheelFD);
	this.wheelFront = Global.physics.createDynamicBody(wheelFront_offset);
	this.wheelFront.createFixture(planck.Circle(this.wheel_radius), wheelFD);

	// join wheels to body with wheel joints
	this.springBack = Global.physics.createJoint(planck.WheelJoint(joint, this.body, this.wheelBack, this.wheelBack.getPosition(), planck.Vec2(0.0, 1.0)));
	this.springFront = Global.physics.createJoint(planck.WheelJoint(joint, this.body, this.wheelFront, this.wheelFront.getPosition(), planck.Vec2(0.0, 1.0)));

	// move body into specified x, y position
	this.body.setPosition(xy_vector);
	this.body.setAngle(Math.PI);
	this.wheelBack.setPosition(xy_vector);
	this.wheelFront.setPosition(xy_vector);

	// add wheel sensors
	this.sensor = {touchingF : false, touchingB : false};
	this.add_sensors();

	// add sprite, to be joined to body. also add some helper funcs.
	this.sprite = Global.game.add.sprite(0, 0, "coyote");
	this.sprite.anchor.set(0.5, 0.5);
	this.sprite_left = function(){
		this.sprite.scale.set(-this.sprite_scale, this.sprite_scale);
	};
	this.sprite_right = function(){
		this.sprite.scale.set(this.sprite_scale, this.sprite_scale);
	};
	this.sprite_is_left = function(){
		return this.sprite.scale.x < 0
	};
	this.sprite_is_right = function(){
		return this.sprite.scale.x > 0
	};
	this.sprite_right();

	this.setupAnimation();

	// set up inputs
	this.keys = Global.game.input.keyboard.createCursorKeys();
	this.keys.w = Global.game.input.keyboard.addKey( Phaser.Keyboard.W );
	this.keys.a = Global.game.input.keyboard.addKey( Phaser.Keyboard.A );
	this.keys.s = Global.game.input.keyboard.addKey( Phaser.Keyboard.S );
	this.keys.d = Global.game.input.keyboard.addKey( Phaser.Keyboard.D );
	this.keys.q = Global.game.input.keyboard.addKey( Phaser.Keyboard.Q );
	this.keys.e = Global.game.input.keyboard.addKey( Phaser.Keyboard.E );
	this.keys.space = Global.game.input.keyboard.addKey( Phaser.Keyboard.SPACEBAR );
};

Player.prototype.setupAnimation = function ()
{
	this.animations = {};
	this.animations['idle'] = [0];
	this.animations['crouch'] = [1];
	this.animations['kick'] = [2,3,4,0];

	this.setAnimation( 'idle' );
};

Player.prototype.setAnimation = function ( newState )
{
	if ( this.state != newState )
	{
		this.state = newState;
		this.sprite.frame = this.animations[newState][0];
	}
};

// Add sensor below player to detect ground. Activates this.sensor.touching
Player.prototype.add_sensors = function()
{
	fd = {};
	fd.shape = planck.Circle(Vec2(0.0, 0.0), this.wheel_radius*2);
	fd.isSensor = true;
	var m_sensorF = this.wheelFront.createFixture(fd);
	var m_sensorB = this.wheelBack.createFixture(fd);
	m_sensorF.m_userData = this.sensor;
	m_sensorB.m_userData = this.sensor;

	// Implement contact listener.
	Global.physics.on('begin-contact', function(contact) {
		var fixtureA = contact.getFixtureA();
		var fixtureB = contact.getFixtureB();

		if (fixtureA == m_sensorF) {
			m_sensorF.m_userData.touchingF += 1;
		}
		if (fixtureA == m_sensorB) {
			m_sensorB.m_userData.touchingB += 1;
		}

		if (fixtureB == m_sensorF) {
			m_sensorF.m_userData.touchingF += 1;
		}
		if (fixtureB == m_sensorB) {
			m_sensorB.m_userData.touchingB += 1;
		}
	});

	// Implement contact listener.
	Global.physics.on('end-contact', function(contact) {
		var fixtureA = contact.getFixtureA();
		var fixtureB = contact.getFixtureB();

		if (fixtureA == m_sensorF) {
			m_sensorF.m_userData.touchingF -= 1;
		}
		if (fixtureA == m_sensorB) {
			m_sensorB.m_userData.touchingB -= 1;
		}

		if (fixtureB == m_sensorF) {
			m_sensorF.m_userData.touchingF -= 1;
		}
		if (fixtureB == m_sensorB) {
			m_sensorB.m_userData.touchingB -= 1;
		}
	});
};

Player.prototype.update = function ()
{
	var p = new Phaser.Point( 0, 0 );
	var left = this.keys.left.isDown || this.keys.a.isDown;
	var right = this.keys.right.isDown || this.keys.d.isDown;
	var down = this.keys.down.isDown || this.keys.s.isDown;
	var up = this.keys.up.isDown || this.keys.w.isDown;

	if ( left )		p.x -= 1;
	if ( right )	p.x += 1;
	if ( up )		p.y -= 1;
	if ( down )		p.y += 1;

	// rotate sprite according to speed
	this.sprite.angle = (this.body.getAngle() * 180 )/Math.PI -180;

	// do this calculation early so we can use it twice
	let jump_hold_time = Math.min(Date.now() - this.jump_start_time, this.jump_charge_time);

	if (!this.keys.space.isDown) {
		// Jump release
		if (this.keys.space.justUp) {
			if (this.jump_start_time && this.sensor.touchingF && this.sensor.touchingB) {
				let jump_speed = this.jump_speed_max * (jump_hold_time / this.jump_charge_time);
				let jump_vector = planck.Vec2(0, -jump_speed);  //straight up vector
				if (this.jump_normal) {
					// rotate in the direction of normal
					jump_vector = rotate_verts([planck.Vec2(0, -jump_speed)], this.body.getAngle() - Math.PI)[0];
				}
				this.body.applyLinearImpulse(jump_vector, this.body.getPosition());
				this.wheelBack.applyLinearImpulse(jump_vector, this.wheelBack.getPosition());
				this.wheelFront.applyLinearImpulse(jump_vector, this.wheelFront.getPosition());
			}
			this.jump_start_time = undefined;
		}

		// Animate
		this.setAnimation('idle');

		// Unset blinking animation
		this.sprite.scale.y = this.sprite_scale;
		this.sprite.alpha = 1.0;

		// Move
		if (left && right)
			this.move(true, 0);
		else if (right)
			this.move(true, 1);
		else if (left)
			this.move(true, -1);
		else
			this.move(false, 0);
	}
	else {
		// Jump start
		if (this.keys.space.justDown) {
			this.jump_start_time = Date.now();
		}

		// Animate
		this.setAnimation('crouch');

		// Blinking animation upon full charge
		if (jump_hold_time == this.jump_charge_time && this.step%5==0) {
			this.sprite.alpha = 1.8 - this.sprite.alpha;
		}

		// Don't move
		this.move(false, 0);
	}

	// lean
	if (this.keys.q.isDown) {
		this.body.applyAngularImpulse(-this.lean_torque)
	}
	if (this.keys.e.isDown) {
		this.body.applyAngularImpulse(this.lean_torque)
	}

	// progress through animations
	this.step += 1;
	var a = this.animations[this.state];
	var f = Math.round( this.step / 10 );
	this.sprite.frame = a[f % a.length];
};

Player.prototype.move = function (active, direction) {
	this.setAnimation(active ? 'kick' : 'idle');

	// set sprite direction
	if (direction < 0)
		this.sprite_left();
	else if (direction > 0)
		this.sprite_right();
	else {
		// if player changes direction without input, wait for wheels to spin faster
		// than this.sprite_turn_threshold, so things don't flip out around zero.
		let current_speed = this.springBack.getJointSpeed();
		if (this.sprite_is_right() && current_speed < -this.sprite_turn_threshold) {
			this.sprite_left();
		} else if (this.sprite_is_left() && current_speed > this.sprite_turn_threshold) {
			this.sprite_right();
		}
	}

	// set sprite position
	let body_pos = this.body.getPosition();
	this.sprite.centerX = body_pos.x;
	this.sprite.centerY = body_pos.y;

	// spin motors
	let motor = function (wheel, sensor, motor_speed) {
		if (sensor) {
			wheel.enableMotor(active);
			wheel.setMotorSpeed(direction * motor_speed);
		} else {
			wheel.enableMotor(false);
			wheel.setMotorSpeed(0);
		}
	};

	motor(this.springBack, this.sensor.touchingB, this.motor_speed);
	motor(this.springFront, this.sensor.touchingF, this.motor_speed);
};

Player.prototype.render = function (graphics) {
	// draw some shapes to let us see the physics behind the scenes.
	// in normal, non-debug gameplay, these should not be drawn!

	if (this.debug) {
		graphics.lineStyle(0.2, 0, 1.0);

        // colors
        let red = 0xFF0000;
        let green = 0x00FF00;
        let blue = 0x0000FF;

        // draw body
        let body_pos = this.body.getPosition();
        graphics.beginFill(red, 1);
        graphics.drawCircle(body_pos.x, body_pos.y, this.body_radius * 2);

        // draw wheels
        let wheelBack_pos = this.wheelBack.getPosition();
        graphics.beginFill(this.sensor.touchingB ? green : blue, 0.5);
        graphics.drawCircle(wheelBack_pos.x, wheelBack_pos.y, this.wheel_radius * 2);
        let wheelFront_pos = this.wheelFront.getPosition();
        graphics.beginFill(this.sensor.touchingF ? green : blue, 0.5);
        graphics.drawCircle(wheelFront_pos.x, wheelFront_pos.y, this.wheel_radius * 2);

        // draw wheel joints
        graphics.lineStyle(1, red, 1.0);
        graphics.moveTo(this.springBack.getAnchorA().x, this.springBack.getAnchorA().y);
        graphics.lineTo(this.springBack.getAnchorB().x, this.springBack.getAnchorB().y);
        graphics.lineStyle(1, red, 1.0);
        graphics.moveTo(this.springFront.getAnchorA().x, this.springFront.getAnchorA().y);
        graphics.lineTo(this.springFront.getAnchorB().x, this.springFront.getAnchorB().y);
    }
};

// utils
function rotate_vert(vert, angle) {
	return planck.Vec2(
		(Math.cos(angle) * vert.x - Math.sin(angle) * vert.y),
		(Math.sin(angle) * vert.x + Math.cos(angle) * vert.y)
	)
}

function rotate_verts(verts, angle) {
	return verts.map(function(item) {
		return rotate_vert(item, angle);
	});
}
