<template>
    <div class="full-page-container" :class="{'full-page-container--dark': gameStarted}">
        <h1>Create a story with the help of AI</h1>

        <div class="central-content">
            <div v-if="!gameStarted">
                <form @submit.prevent="gameStarted = true" class="initial-form">
                    <div class="initial-form__fields-contaienr">
                        <input type="text"
                           v-model="characterName"
                           placeholder="Your Name"
                           class="initial-form-field"
                           required
                        >
                        <div class="sex-selection-container">
                            <button type="button"
                                @click="isCharacterMale = true"
                                class="sex-selection-button sex-selection-button--male"
                                :class="{'sex-selection-button--selected': isCharacterMale}"
                            >M</button>
                            <button type="button"
                                @click="isCharacterMale = false"
                                class="sex-selection-button sex-selection-button--female"
                                :class="{'sex-selection-button--selected': !isCharacterMale}"
                            >F</button>
                        </div>
                    </div>
                    <button type="submit" class="initial-form__start-button">Start</button>
                </form>
            </div>
            <Transition name="panel-fade">
                <div v-if="gameStarted">
                    <button @click="toggleMusic"
                        class="toggle-music-button"
                        :class="{'toggle-music-button--paused': !isMusicPlaying}"
                    />

                    <div class="story-panel">
                        <p class="story-text">
                            {{ storyText }}
                            <template v-if="isLoadingStoryContinuation">
                                <br><br>
                                <span style="opacity: .6">Generation...</span>
                            </template>
                        </p>

                        <form v-show="!isLoadingStoryContinuation"
                            @submit.prevent="continueStory"
                            class="story-continuation-form"
                        >
                            <textarea ref="storyContinuationField"
                              v-model.trim="inputStoryContinuation"
                              class="story-continuation-field"
                              rows="1"
                              placeholder="What happens next?"
                              required
                            ></textarea>

                            <button type="submit"
                                class="story-continuation-submit-button"
                                :disabled="!inputStoryContinuation"
                            />
                        </form>
                    </div>
                </div>
            </Transition>
        </div>
    </div>
</template>

<script>
import autosize from "autosize/dist/autosize";

export default {
    data() {
        return {
            characterName: null,
            isCharacterMale: true,
            gameStarted: false,

            storyText: null,
            inputStoryContinuation: null,
            isLoadingStoryContinuation: false,

            audio: null,
            isMusicPlaying: false,
        };
    },

    mounted() {
        this.audio = new Audio('/music.mp3');
        this.audio.volume = 0.1;
        this.audio.loop = true;
    },

    watch: {
        gameStarted: function (started, hadStarted) {
            if (started && !hadStarted) {
                this.playMusic();
                this.beginStory();
                this.$nextTick(() => {
                    autosize(this.$refs.storyContinuationField);
                });
            }
            if (!started) {
                this.pauseMusic();
            }
        },
    },

    methods: {
        beginStory: function () {
            this.storyText = this.isCharacterMale ?
                `${this.characterName} woke up groggy and disoriented. He was lying on a hard, cold floor, and when he tried to sit up, he realized his hands and feet were bound. He looked around the room and saw that he was in some kind of dungeon. There was a small window high up on one wall, and the only door was made of heavy iron bars.\n\nThe guy tried to stand up, but he was so weak that he could barely move. He leaned against the wall and tried to think of what could have happened. The last thing he remembered was going to bed in his cabin in the middle of the forest. He must have been kidnapped in the night.`
                : `${this.characterName} woke up groggy and disoriented. She was lying on a hard, cold floor, and when she tried to sit up, she realized her hands and feet were bound. She looked around the room and saw that she was in some kind of dungeon. There was a small window high up on one wall, and the only door was made of heavy iron bars.\n\nThe girl tried to stand up, but she was so weak that she could barely move. She leaned against the wall and tried to think of what could have happened. The last thing she remembered was going to bed in her cabin in the middle of the forest. She must have been kidnapped in the night.`;
        },

        continueStory: async function () {
            this.storyText += '\n\n' + this.inputStoryContinuation;

            this.inputStoryContinuation = '';
            await this.$nextTick();
            autosize.update(this.$refs.storyContinuationField);

            window.scrollTo({top: document.body.scrollHeight});

            try {
                this.isLoadingStoryContinuation = true;

                await this.continueStoryUsingAI(this.storyText);
            } finally {
                this.isLoadingStoryContinuation = false;
            }
        },

        continueStoryUsingAI: async function() {
            const { continuation } = await $fetch(
                '/api/continue-story',
                {
                    method: 'POST',
                    body: {
                        character_name: this.characterName,
                        story: this.storyText,
                    },
                }
            );

            this.storyText += continuation;
        },

        toggleMusic: function () {
            if (this.isMusicPlaying)
                this.pauseMusic();
            else
                this.playMusic();
        },

        playMusic: function () {
            this.audio.play();
            this.isMusicPlaying = true;
        },

        pauseMusic: function () {
            this.audio.pause();
            this.isMusicPlaying = false;
        },
    },
};
</script>

<style>
body {
    background: url('/background.jpg') center fixed;
    background-size: cover;
}
</style>

<style scoped>
.full-page-container {
    display: flex;
    flex-direction: column;
    width: 100%;
    min-height: 100vh;
    transition: background-color .5s;
}

.full-page-container--dark {
    background-color: rgba(0, 0, 0, .2);
}

h1 {
    font-size: xx-large;
    color: white;
    text-align: center;
    padding: 20px;
    background: rgba(0, 0, 0, .8);
}

.central-content {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-grow: 1;
    padding: 60px 20px 90px;
}

.initial-form {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.initial-form__fields-contaienr {
    display: flex;
    align-items: center;
}

.initial-form-field {
    min-width: 300px;
    padding: 12px 20px;
    border: 1px solid lightgrey;
    border-radius: 5px 0 0 5px;
    outline: none;
    font-family: Helvetica, sans-serif;
    font-size: large;
    font-weight: bold;
    text-align: center;
    transition: border-color .1s;
}

.sex-selection-container {
    align-self: stretch;
    display: flex;
    flex-direction: column;
    background-color: white;
    border-radius: 0 5px 5px 0;
    overflow: hidden;
}

.sex-selection-button {
    height: 100%;
    padding-left: 6px;
    padding-right: 6px;
    font-family: Helvetica, sans-serif;
    border: none;
    background: none;
    cursor: pointer;
    opacity: .5;
    transition: opacity .1s;
}

.sex-selection-button--male {
    color: #000083;
}

.sex-selection-button--female {
    color: #983763;
}

.sex-selection-button--selected {
    opacity: 1;
}

.initial-form__start-button {
    display: inline-block;
    min-width: 200px;
    margin-top: 45px;
    padding: 15px 30px;
    border: 2px solid rgba(16, 73, 22, 0.21);
    border-radius: 40px;
    text-align: center;
    font-size: large;
    font-family: inherit;
    font-weight: bold;
    letter-spacing: 1px;
    text-decoration: none;
    text-transform: uppercase;
    cursor: pointer;
    transition: background-color .2s;
}

.start-button:hover,
.start-button:focus {
    background: #dcdcdc;
}

.toggle-music-button {
    position: fixed;
    bottom: calc(50px + 1vw);
    right: calc(56px + 1vw);

    cursor: pointer;
    background: none;
    border: none;
}

.toggle-music-button::before {
    content: ' ';
    display: inline-block;
    width: 48px;
    height: 48px;
    background-color: transparent;
    background-repeat: no-repeat;
    background-position: center center;
    background-size: contain;

    background-image: url('/icons/volume.png');
    opacity: .4;
}

.toggle-music-button--paused::before {
    background-image: url('/icons/volume-mute.png') !important;
}

.story-panel {
    display: flex;
    flex-direction: column;
    max-width: 800px;
    height: 100%;
    margin: 0 auto;
    padding: calc(20px + 1vw);
    font-size: x-large;

    background: rgba(255, 255, 255, .95);
    box-shadow: 0 0 10px 0 rgba(240, 240, 240, .9);
    border-radius: 5px;
}

.story-text {
    white-space: pre-wrap; /* so that line breaks are preserved */
    word-break: break-word;
}

.story-continuation-form {
    display: flex;
    align-items: flex-end;
    margin-top: 28px;
    border: 1px solid transparent;
    border-radius: 5px;
}

.story-continuation-field {
    flex-grow: 1;
    max-height: 35vh;
    padding: 6px 16px;
    outline: none;
    resize: none;
    background: transparent;
    border: none;
    border-left: 2px solid transparent;
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
}

.story-continuation-field:focus {
    border-color: #e3e3e3;
}

.story-continuation-submit-button {
    margin-right: 6px;
    margin-bottom: 8px;
    cursor: pointer;
    background: none;
    border: none;
    opacity: .8;
    transition: opacity .1s;
}

.story-continuation-submit-button:hover,
.story-continuation-submit-button:focus {
    opacity: .6;
}

.story-continuation-submit-button::before {
    content: ' ';
    display: block;
    width: 32px;
    height: 32px;
    background-color: transparent;
    background-repeat: no-repeat;
    background-position: center center;
    background-size: contain;

    background-image: url('/icons/continue.png');
}

.story-continuation-submit-button[disabled] {
    cursor: initial;
    opacity: .3;
}

.panel-fade-enter-active,
.panel-fade-leave-active {
    transition: opacity 1.5s ease;
}

.panel-fade-enter-from,
.panel-fade-leave-to {
    opacity: 0;
}
</style>
