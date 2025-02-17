## How to Run a Steady State Project

### Step 1) Install Rust in a LINUX System

You first need to install Rust on a LINUX System with the following line:
    
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

if on mac:

https://www.rust-lang.org/tools/install


### Step 2) Create Steady-State Cargo
Create a new cargo folder:

    cargo new name_of_cargo

cd into this folder, then run:

    cargo add steady_state

then run:

    cargo install cargo-steady-state


### Step 3) Download .dot file
Download the .dot file and store in in your cargo folder

### Step 4) .dot file
Within the cargo folder, run:

    cargo-steady-state -d name_of_the_dot_file.dot -n name_you_want_to_give

### Step 5) Test the build
Run this line to build, it may not work but that is fine:

    cargo build

Then click on the https link it provides

### Step 6) Issues Arise
You may need to run the following lines if there were issues with building the cargo:

    sudo apt update && sudo apt install pkg-config

and then run:

    sudo apt install libssl-dev

and then you can build it:

    cargo build





