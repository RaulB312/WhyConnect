import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

import XSvg from "../../../components/svgs/X";

import { MdOutlineMail, MdPassword } from "react-icons/md";

const LoginPage = () => {
	const [formData, setFormData] = useState({
		username: "",
		password: "",
	});
	const [forgotPassword, setForgotPassword] = useState(false);
	const [resetStep, setResetStep] = useState(1);
	const [resetData, setResetData] = useState({
		email: "",
		verificationCode: "",
		newPassword: "",
	});

	const queryClient = useQueryClient();

	const loginMutation = useMutation({
		mutationFn: async ({ username, password }) => {
			const res = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username, password }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Something went wrong");
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["authUser"] });
			toast.success("Login successful");
		},
	});

	const requestResetCode = useMutation({
		mutationFn: async ({ email }) => {
			const res = await fetch("/api/auth/request-password-reset", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Something went wrong");
			return data;
		},
		onSuccess: () => {
			toast.success("Verification code sent to email");
			setResetStep(2);
		},
	});

	const resetPasswordMutation = useMutation({
		mutationFn: async ({ email, verificationCode, newPassword }) => {
			const res = await fetch("/api/auth/reset-password", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, verificationCode, newPassword }),
			});
			const data = await res.json();
			if (!res.ok) throw new Error(data.error || "Something went wrong");
			return data;
		},
		onSuccess: () => {
			toast.success("Password reset successfully");
			setForgotPassword(false);
			setResetStep(1);
			setResetData({ email: "", verificationCode: "", newPassword: "" });
		},
	});

	const handleSubmit = (e) => {
		e.preventDefault();
		loginMutation.mutate(formData);
	};

	const handleInputChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleResetInputChange = (e) => {
		setResetData({ ...resetData, [e.target.name]: e.target.value });
	};

	return (
	<div className="max-w-screen-xl mx-auto flex h-screen">
		<div className="flex-1 hidden lg:flex items-center justify-center">
		<XSvg className="lg:w-2/3 fill-white" />
		</div>
		<div className="flex-1 flex flex-col justify-center items-center">
		{!forgotPassword ? (
			<form className="flex gap-4 flex-col" onSubmit={handleSubmit}>
			<XSvg className="w-24 lg:hidden fill-white" />
			<h1 className="text-4xl font-extrabold text-white">{"Let's"} go.</h1>
			<label className="input input-bordered rounded flex items-center gap-2">
				<MdOutlineMail />
				<input
				type="text"
				className="grow"
				placeholder="Username"
				name="username"
				onChange={handleInputChange}
				value={formData.username}
				/>
			</label>
			<label className="input input-bordered rounded flex items-center gap-2">
				<MdPassword />
				<input
				type="password"
				className="grow"
				placeholder="Password"
				name="password"
				onChange={handleInputChange}
				value={formData.password}
				/>
			</label>
			<span
				className="text-sm text-blue-300 cursor-pointer hover:underline text-center"
				onClick={() => setForgotPassword(true)}
			>
				Forgot Password?
			</span>
			<button className="btn rounded-full btn-primary text-white">
				{loginMutation.isPending ? "Loading..." : "Sign In"}
			</button>
			{loginMutation.isError && <p className="text-red-500">{loginMutation.error.message}</p>}
			</form>
		) : (
			<form className="flex gap-4 flex-col">
			<h1 className="text-3xl font-extrabold text-white">Reset Password</h1>
			{/* Step 1: Email + send code */}
			{resetStep === 1 && (
				<>
				<label className="input input-bordered rounded flex items-center gap-2">
					<MdOutlineMail />
					<input
					type="email"
					className="grow"
					placeholder="Your Email"
					name="email"
					onChange={handleResetInputChange}
					value={resetData.email}
					/>
				</label>
				<button
					type="button"
					className="btn rounded-full btn-primary text-white"
					onClick={() => requestResetCode.mutate({ email: resetData.email })}
				>
					{requestResetCode.isPending ? "Sending..." : "Send Verification Code"}
				</button>
				</>
			)}
			{/* Step 2: Code + new password */}
			{resetStep === 2 && (
				<>
				<input
					type="text"
					className="input input-bordered rounded"
					placeholder="Verification Code"
					name="verificationCode"
					onChange={handleResetInputChange}
					value={resetData.verificationCode}
				/>
				<input
					type="password"
					className="input input-bordered rounded"
					placeholder="New Password"
					name="newPassword"
					onChange={handleResetInputChange}
					value={resetData.newPassword}
				/>
				<button
					type="button"
					className="btn rounded-full btn-primary text-white"
					onClick={() =>
					resetPasswordMutation.mutate({
						email: resetData.email,
						verificationCode: resetData.verificationCode,
						newPassword: resetData.newPassword,
					})
					}
				>
					{resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
				</button>
				</>
			)}
			<button
				type="button"
				className="text-sm text-blue-300 cursor-pointer hover:underline text-center"
				onClick={() => {
				setForgotPassword(false);
				setResetStep(1);
				}}
			>
				Back to Login
			</button>
			{requestResetCode.isError && <p className="text-red-500">{requestResetCode.error.message}</p>}
			{resetPasswordMutation.isError && <p className="text-red-500">{resetPasswordMutation.error.message}</p>}
			</form>
		)}
		<div className="flex flex-col gap-2 mt-4">
			<p className="text-white text-lg">{"Don't"} have an account?</p>
			<Link to="/signup">
			<button className="btn rounded-full btn-primary text-white btn-outline w-full">Sign up</button>
			</Link>
		</div>
		</div>
	</div>
	);
};

export default LoginPage;
