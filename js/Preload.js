var Global = Global || {};

//loading the game assets
Global.Preload = function() {};

Global.Preload.prototype = {
	preload: function () {
		
		this.game.stage.backgroundColor = '#111111';


		/* Fonts */

		//this.load.bitmapFont( 'Balsamiq', 'assets/fonts/balsamiq_regular.png', 'assets/fonts/balsamiq_regular.fnt' );


		/* Sprites */
		this.load.image( 'cool', 'assets/sprites/cool.png' );
		this.load.image( 'coyotecrouch', 'assets/sprites/coyotecrouch.png' );
		this.load.image( 'coyotekick1', 'assets/sprites/coyotekick1.png' );
		this.load.image( 'coyotekick2', 'assets/sprites/coyotekick2.png' );
		this.load.image( 'coyotekick3', 'assets/sprites/coyotekick3.png' );
		this.load.image( 'coyote', 'assets/sprites/coyote.png' );
		this.load.image( 'coyotetrick1', 'assets/sprites/coyotetrick1.png' );
		this.load.image( 'desert', 'assets/sprites/desert.png' );
		this.load.image( 'halfpipe', 'assets/sprites/halfpipe.png' );
		this.load.image( 'saloon', 'assets/sprites/saloon.png' );
		this.load.image( 'slick', 'assets/sprites/slick.png' );
		//this.load.spritesheet( 'name', 'assets/sprites/sheet.png', 32, 32 );


		/* Audio */

		//this.load.audio( 'sound', 'assets/sounds/sound.ogg' );


		// Loading progress bar
		var scale = 4;
		var x = this.game.world.centerX - this.game.cache.getImage( 'preloader-bar' ).width / 2 * scale;
		var y = this.game.world.centerY;
		var progressBg = this.game.add.sprite( x, y, 'preloader-bar' );
		var progressFg = this.game.add.sprite( x, y, 'preloader-bar' );
		progressBg.tint = 0x444444;
		progressBg.anchor.set( 0, 0.5 );
		progressFg.anchor.set( 0, 0.5 );
		progressBg.scale.set( scale );
		progressFg.scale.set( scale );
		this.game.load.setPreloadSprite( progressFg );

	},
	create: function () {
		Global.Audio = new AudioManager();

		this.state.start( 'MainMenu' );
	}
};
