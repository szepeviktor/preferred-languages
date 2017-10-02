( ( ( wp, settings, $ ) => {
	const $activeLocales           = $( '.active-locales-list' );
	const $activeLocalesControls   = $( '.active-locales-controls' );
	const $inactiveLocales         = $( '.inactive-locales-list' );
	const $inactiveLocalesControls = $( '.inactive-locales-controls' );
	let $selectedLocale            = $activeLocales.find( 'li[aria-selected="true"]' );
	const $inputField              = $( 'input[name="preferred_languages"]' );

	/**
	 * Changes the move button states.
	 *
	 * @since 1.0.0
	 *
	 * @param {jQuery} activeLocale Active locale element.
	 */
	function changeButtonState( activeLocale ) {
		const activeLocalesList = $activeLocales.find( '.active-locale' );

		$activeLocalesControls.find( '.locales-move-up' ).attr(
			'disabled',
			$activeLocales.hasClass( 'empty-list' ) || activeLocalesList.first().is( activeLocale )
		);
		$activeLocalesControls.find( '.locales-move-down' ).attr(
			'disabled',
			$activeLocales.hasClass( 'empty-list' ) || activeLocalesList.last().is( activeLocale )
		);
		$activeLocalesControls.find( '.locales-remove' ).attr(
			'disabled',
			$activeLocales.hasClass( 'empty-list' )
		);
	}

	/**
	 * Toggles a locale.
	 *
	 * @since 1.0.0
	 *
	 * @param {jQuery} locale Locale element.
	 */
	function toggleLocale( locale ) {
		const selected = locale.attr( 'aria-selected' );
		const newState = !! selected;

		// It's already the current locale, so nothing to do here.
		if ( true === selected ) {
			return;
		}

		$selectedLocale.attr( 'aria-selected', false );

		locale.attr( 'aria-selected', newState );

		if ( true === newState ) {
			$selectedLocale = locale;

			$activeLocales.attr( 'aria-activedescendant', $selectedLocale.attr( 'id' ) );
		}

		changeButtonState( locale );
	}

	/**
	 * Updates the preferred languages input field after a change.
	 *
	 * @since 1.0.0
	 */
	function updateHiddenInput() {
		const locales = [];

		$activeLocales.children( '.active-locale' ).each( () => {
			locales.push( $( this ).attr( 'id' ) );
		} );

		$inputField.val( locales.join( ',' ) );
	}

	/**
	 * Moves a locale up in the list.
	 *
	 * @since 1.0.0
	 */
	function moveLocaleUp() {

		// 1. Change position if possible.
		$selectedLocale.insertBefore( $selectedLocale.prev() );

		// 2. Update hidden input field.
		updateHiddenInput();

		// 3. Update buttons.
		changeButtonState( $selectedLocale );

		// 4. Announce to assistive technologies.
		wp.a11y.speak( settings.l10n.movedUp );
	}

	/**
	 * Moves a locale down in the list.
	 *
	 * @since 1.0.0
	 */
	function moveLocaleDown() {

		// 1. Change position if possible.
		$selectedLocale.insertAfter( $selectedLocale.next() );

		// 2. Update hidden input field.
		updateHiddenInput();

		// 3. Update buttons.
		changeButtonState( $selectedLocale );

		// 4. Announce to assistive technologies.
		wp.a11y.speak( settings.l10n.movedDown );
	}

	/**
	 * Displays a message in case the list of active locales is empty.
	 *
	 * @since 1.0.0
	 */
	function showEmptyListMessage() {
		$activeLocales.addClass( 'empty-list' );
		$activeLocales.attr( 'aria-activedescendant', '' );
		$activeLocales.find( '#active-locales-list-empty-message' ).removeClass( 'hidden' );
	}

	/**
	 * Hides the empty list of locales message.
	 *
	 * @since 1.0.0
	 */
	function hideEmptyListMessage() {
		$activeLocales.removeClass( 'empty-list' );
		$activeLocales.find( '#active-locales-list-empty-message' ).addClass( 'hidden' );
	}

	/**
	 * Removes an active locale from the list.
	 *
	 * @since 1.0.0
	 */
	function removeActiveLocale() {
		let locale = $selectedLocale.attr( 'id' );
		let $successor;

		$successor = $selectedLocale.prev( ':visible' );

		if ( 0 === $successor.length ) {
			$successor = $selectedLocale.next( ':visible' );
		}

		// 1. Remove selected locale.
		$selectedLocale.remove();

		// 2. Make another locale the current one.
		if ( $successor.length > 0 ) {
			toggleLocale( $successor );
		} else {
			showEmptyListMessage();
		}

		// 3. Update buttons.
		changeButtonState( $selectedLocale );

		// 4. Update hidden input field.
		updateHiddenInput();

		// 5. Make visible in dropdown again.
		$inactiveLocales.find( `select option[value="${locale}"]` ).removeClass( 'hidden' );

		// 6. Announce to assistive technologies.
		wp.a11y.speak( settings.l10n.localeRemoved );
	}

	/**
	 * Makes an inactive locale active.
	 *
	 * @since 1.0.0
	 *
	 * @param {jQuery} option The locale element.
	 */
	function makeLocaleActive( option ) {
		const $newLocale = $( '<li/>', { 'id': option.val(), text: option.text(), 'aria-selected': false, 'class': 'active-locale' } );
		let $successor;

		$successor = option.prev( ':not(.hidden)' );

		if ( 0 === $successor.length ) {
			$successor = option.next( ':not(.hidden)' );
		}

		if ( 0 === $successor.length ) {
			$successor = $inactiveLocales.find( 'option' ).first();
		}

		// 1. Change selected value in dropdown.
		$successor.attr( 'selected', true );
		$inactiveLocalesControls.val( $successor.val() );

		// 2. Hide from dropdown.
		option.removeAttr( 'selected' ).addClass( 'hidden' );

		// It's already in the list of active locales, stop here.
		if ( $activeLocales.find( `#${option.val()}` ).length > 0 ) {
			return;
		}

		// 3. Hide empty list message if present.
		if ( $activeLocales.hasClass( 'empty-list' ) ) {
			hideEmptyListMessage();
		}

		// 4. Add to list.
		$activeLocales.append( $newLocale );

		toggleLocale( $newLocale );

		// 5. Scroll into view.
		$activeLocales.animate({
			scrollTop: $newLocale.offset().top - $activeLocales.offset().top + $activeLocales.scrollTop()
		});

		// 5. Update hidden input field.
		updateHiddenInput();

		// 6. Announce to assistive technologies.
		wp.a11y.speak( settings.l10n.localeAdded );
	}

	// Hide original language settings.
	$( '.user-language-wrap' ).remove();
	$( '#WPLANG' ).parent().parent().remove();

	// Remove en_US as an option from the dropdown.
	$inactiveLocales.find( '[lang="en"]' ).remove();

	// Change initial button state.
	changeButtonState( $selectedLocale );

	// Initially hide already active locales from dropdown.
	if ( $inputField.val().length ) {
		$.each( $inputField.val().split( ',' ), ( index, value ) => {
			makeLocaleActive( $inactiveLocales.find( `[value="${value}"]` ) );
		} );
	}

	// Enabling sorting locales using drag and drop.
	$activeLocales.sortable({
		axis: 'y',
		cursor: 'move',
		items: ':not(#active-locales-list-empty-message)'
	});

	// Arrow key handler.
	$activeLocales.on( 'keydown', e => {

		// Up.
		if ( 38 === e.which ) {
			if ( e.altKey ) {
				moveLocaleUp();
			} else {
				$selectedLocale.prev().length && toggleLocale( $selectedLocale.prev() );
			}

			e.preventDefault();
		}

		// Down.
		if ( 40 === e.which ) {
			if ( e.altKey ) {
				moveLocaleDown();
			} else {
				$selectedLocale.next().length && toggleLocale( $selectedLocale.next() );
			}

			e.preventDefault();
		}

		// Backspace.
		if ( 8 === e.which ) {
			removeActiveLocale();
			e.preventDefault();
		}
	} );

	// Add new locale to list.
	$inactiveLocalesControls.find( '.locales-add' ).on( 'click', () => {
		makeLocaleActive( $inactiveLocales.find( 'select option:selected' ) );
	} );

	// Select a locale.
	$activeLocales.on( 'click', '.active-locale', ( e ) => {
		toggleLocale( $( e.currentTarget ) );
	} );

	$activeLocalesControls.find( '.locales-move-up' ).on( 'click', moveLocaleUp );

	$activeLocalesControls.find( '.locales-move-down' ).on( 'click', moveLocaleDown );

	// Remove locale from list.
	$activeLocalesControls.find( '.locales-remove' ).on( 'click', removeActiveLocale );
} ) )( wp, preferredLanguages, jQuery );